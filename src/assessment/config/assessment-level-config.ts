import { featureFlagsService } from '@curiouslearning/features';

export type AssessmentLevelsMode = 'percentage' | 'constant';

export interface ParsedAssessmentConfigEntry {
  assessmentType: string;
  level: number;
}

export interface ResolvedAssessmentTarget {
  levelIndex: number;
  assessmentType: string;
}

export interface ParsedAssessmentLevelsConfig {
  enabled: boolean;
  mode: AssessmentLevelsMode | null;
  assessments: ParsedAssessmentConfigEntry[];
}

type DynamicConfigProvider = (configKey: string) => unknown;

const ASSESSMENT_LEVELS_CONFIG_KEY = 'assessmentlevels';

/**
 * Resolves assessment level rules from feature flags and maps them to
 * language-specific 0-based level indexes.
 */
export class AssessmentLevelConfig {
  private parsedConfig: ParsedAssessmentLevelsConfig = {
    enabled: false,
    mode: null,
    assessments: [],
  };

  /**
   * @param dynamicConfigKey Feature flag key for assessment level config.
   * @param configProvider Provider used to fetch raw dynamic config.
   */
  constructor(
    private readonly dynamicConfigKey: string = ASSESSMENT_LEVELS_CONFIG_KEY,
    private readonly configProvider: DynamicConfigProvider = (configKey: string) =>
      featureFlagsService.getDynamicConfig(configKey, false)
  ) {}

  /**
   * Fetches the latest dynamic config and stores a normalized copy locally.
   */
  public refreshConfig(): ParsedAssessmentLevelsConfig {
    const rawConfig = this.configProvider(this.dynamicConfigKey);
    this.parsedConfig = this.parse(rawConfig);
    return this.parsedConfig;
  }

  /**
   * Returns normalized config, refreshing it when requested or uninitialized.
   */
  private getParsedConfig(refresh = false): ParsedAssessmentLevelsConfig {
    if (refresh || this.parsedConfig.mode === null) {
      return this.refreshConfig();
    }

    return this.parsedConfig;
  }

  /**
   * Resolves target assessment levels as 0-based indexes for the current
   * language level count.
   *
   * @param totalLevels Total levels available in the language dataset.
   * @param refresh When true, re-fetches dynamic config before mapping.
   */
  public getTargetLevelIndexes(totalLevels: number, refresh = false): number[] {
    const targets = this.getTargetAssessments(totalLevels, refresh);
    return uniqueSorted(targets.map((target) => target.levelIndex));
  }

  /**
   * Resolves all configured assessment targets for the current language level count.
   */
  public getTargetAssessments(totalLevels: number, refresh = false): ResolvedAssessmentTarget[] {
    const parsedConfig = this.getParsedConfig(refresh);
    return this.toTargets(parsedConfig, totalLevels);
  }

  /**
   * Returns configured assessment type for a specific 0-based level index.
   */
  public getAssessmentTypeForLevel(
    levelIndex: number,
    totalLevels: number,
    refresh = false
  ): string | null {
    if (!Number.isInteger(levelIndex) || levelIndex < 0) {
      return null;
    }

    const target = this
      .getTargetAssessments(totalLevels, refresh)
      .find((resolvedTarget) => resolvedTarget.levelIndex === levelIndex);

    return target?.assessmentType || null;
  }

  /**
   * Checks if assessment should be eligible on a specific 0-based level index.
   *
   * @param levelIndex 0-based game level index.
   * @param totalLevels Total levels available in the language dataset.
   * @param refresh When true, re-fetches dynamic config before evaluation.
   */
  public shouldShowAtLevel(levelIndex: number, totalLevels: number, refresh = false): boolean {
    return this.getTargetLevelIndexes(totalLevels, refresh).includes(levelIndex);
  }

  /**
   * Validates and normalizes the raw Statsig dynamic config payload.
   */
  private parse(rawConfig: unknown): ParsedAssessmentLevelsConfig {
    if (!rawConfig || typeof rawConfig !== 'object') {
      return {
        enabled: false,
        mode: null,
        assessments: [],
      };
    }

    const config = rawConfig as {
      enabled?: unknown;
      mode?: unknown;
      assessments?: unknown;
    };
    const modeValue = typeof config.mode === 'string'
      ? config.mode.trim().toLowerCase()
      : '';
    const isEnabled = config.enabled === true;

    if (modeValue !== 'percentage' && modeValue !== 'constant') {
      return {
        enabled: false,
        mode: null,
        assessments: [],
      };
    }

    if (!isEnabled) {
      return {
        enabled: false,
        mode: modeValue,
        assessments: [],
      };
    }

    if (!Array.isArray(config.assessments)) {
      return {
        enabled: false,
        mode: modeValue,
        assessments: [],
      };
    }

    const normalizedAssessments = modeValue === 'percentage'
      ? normalizeAssessments(config.assessments, normalizePercentageLevel)
      : normalizeAssessments(config.assessments, normalizeConstantLevel);

    return {
      enabled: normalizedAssessments.length > 0,
      mode: modeValue,
      assessments: normalizedAssessments,
    };
  }

  /**
   * Converts normalized config targets into clamped 0-based level indexes.
   */
  private toTargets(
    config: ParsedAssessmentLevelsConfig,
    totalLevels: number
  ): ResolvedAssessmentTarget[] {
    if (!config.enabled || !config.mode || totalLevels < 1) {
      return [];
    }

    const resolvedTargets: ResolvedAssessmentTarget[] = [];
    const seenTargets = new Set<string>();

    config.assessments.forEach((assessment) => {
      const levelIndex = config.mode === 'percentage'
        ? clamp(Math.ceil(assessment.level * totalLevels) - 1, 0, totalLevels - 1)
        : clamp(assessment.level - 1, 0, totalLevels - 1);

      const dedupeKey = `${assessment.assessmentType}:${levelIndex}`;
      if (seenTargets.has(dedupeKey)) {
        return;
      }

      seenTargets.add(dedupeKey);
      resolvedTargets.push({
        levelIndex,
        assessmentType: assessment.assessmentType,
      });
    });

    return resolvedTargets;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeAssessmentType(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue ? normalizedValue : null;
}

function normalizeConstantLevel(value: unknown): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }

  const normalizedLevel = Math.trunc(value);
  return normalizedLevel >= 1 ? normalizedLevel : null;
}

function normalizePercentageLevel(value: unknown): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }

  return clamp(value, 0, 1);
}

function normalizeAssessments(
  assessments: unknown[],
  normalizeLevel: (value: unknown) => number | null
): ParsedAssessmentConfigEntry[] {
  const normalizedAssessments: ParsedAssessmentConfigEntry[] = [];
  const seenEntries = new Set<string>();

  assessments.forEach((assessment) => {
    if (!assessment || typeof assessment !== 'object') {
      return;
    }

    const rawAssessment = assessment as { assessmentType?: unknown; level?: unknown };
    const assessmentType = normalizeAssessmentType(rawAssessment.assessmentType);
    const level = normalizeLevel(rawAssessment.level);

    if (!assessmentType || level === null) {
      return;
    }

    const dedupeKey = `${assessmentType}:${level}`;
    if (seenEntries.has(dedupeKey)) {
      return;
    }

    seenEntries.add(dedupeKey);
    normalizedAssessments.push({
      assessmentType,
      level,
    });
  });

  return normalizedAssessments;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

const assessmentLevelConfig = new AssessmentLevelConfig();

export default assessmentLevelConfig;


