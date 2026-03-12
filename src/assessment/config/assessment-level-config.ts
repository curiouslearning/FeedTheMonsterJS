import { featureFlagsService } from '@curiouslearning/features';

export type AssessmentLevelsMode = 'percentage' | 'constant';

export interface ParsedAssessmentLevelsConfig {
  enabled: boolean;
  mode: AssessmentLevelsMode | null;
  levels: number[];
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
    levels: [],
  };

  /**
   * @param dynamicConfigKey Feature flag key for assessment level config.
   * @param configProvider Provider used to fetch raw dynamic config.
   */
  constructor(
    private readonly dynamicConfigKey: string = ASSESSMENT_LEVELS_CONFIG_KEY,
    private readonly configProvider: DynamicConfigProvider = (configKey: string) =>
      featureFlagsService.getDynamicConfig(configKey)
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
    const parsedConfig = this.getParsedConfig(refresh);
    return this.toLevelIndexes(parsedConfig, totalLevels);
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
        levels: [],
      };
    }

    const config = rawConfig as { mode?: unknown; levels?: unknown };
    const modeValue = typeof config.mode === 'string'
      ? config.mode.trim().toLowerCase()
      : '';

    if (modeValue !== 'percentage' && modeValue !== 'constant') {
      return {
        enabled: false,
        mode: null,
        levels: [],
      };
    }

    if (!Array.isArray(config.levels)) {
      return {
        enabled: false,
        mode: modeValue,
        levels: [],
      };
    }

    const numericLevels = config.levels.filter(isFiniteNumber);
    const normalizedLevels = modeValue === 'percentage'
      ? uniqueSorted(numericLevels.map((level) => clamp(level, 0, 1)))
      : uniqueSorted(numericLevels.map((level) => Math.trunc(level)).filter((level) => level >= 1));

    return {
      enabled: normalizedLevels.length > 0,
      mode: modeValue,
      levels: normalizedLevels,
    };
  }

  /**
   * Converts normalized config levels into clamped 0-based level indexes.
   */
  private toLevelIndexes(config: ParsedAssessmentLevelsConfig, totalLevels: number): number[] {
    if (!config.enabled || !config.mode || totalLevels < 1) {
      return [];
    }

    if (config.mode === 'percentage') {
      return uniqueSorted(
        config.levels.map((level) => {
          const levelIndex = Math.ceil(level * totalLevels) - 1;
          return clamp(levelIndex, 0, totalLevels - 1);
        })
      );
    }

    return uniqueSorted(
      config.levels.map((level) => {
        const levelIndex = level - 1;
        return clamp(levelIndex, 0, totalLevels - 1);
      })
    );
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

const assessmentLevelConfig = new AssessmentLevelConfig();

export default assessmentLevelConfig;


