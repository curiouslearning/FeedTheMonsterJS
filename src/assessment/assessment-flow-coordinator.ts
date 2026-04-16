import { AssessmentLevelConfig } from './config/assessment-level-config';
import { AssessmentLevelState } from './assessment-level-state';

type RandomFn = () => number;

const MIN_ASSESSMENT_PUZZLE_SEGMENT = 2;
const MAX_ASSESSMENT_PUZZLE_SEGMENT = 4;

interface AssessmentLevelConfigLike {
  shouldShowAtLevel(levelIndex: number, totalLevels: number, refresh?: boolean): boolean;
  getTargetLevelIndexes?(totalLevels: number, refresh?: boolean): number[];
  getAssessmentTypeForLevel?(levelIndex: number, totalLevels: number, refresh?: boolean): string | null;
}

interface AssessmentLevelStateLike {
  shouldShowForLevel(levelIndex: number): boolean;
  markAssessmentCompletedForLevel(levelIndex: number): void;
}

export interface AssessmentFlowCoordinatorOptions {
  currentLevelIndex: number;
  totalLevels: number;
  puzzleCount: number;
  miniGamePuzzleSegment: number;
  refreshConfig?: boolean;
  randomFn?: RandomFn;
}

export interface AssessmentFlowCoordinatorDependencies {
  levelConfig?: AssessmentLevelConfigLike;
  levelState?: AssessmentLevelStateLike;
}

/**
 * Determines if and where assessment should trigger within a gameplay level,
 * while preserving the mini-game ordering contract.
 */
export class AssessmentFlowCoordinator {
  private readonly currentLevelIndex: number;
  private readonly totalLevels: number;
  private readonly puzzleCount: number;
  private readonly miniGamePuzzleSegment: number;
  private readonly refreshConfig: boolean;
  private readonly randomFn: RandomFn;
  private readonly levelConfig: AssessmentLevelConfigLike;
  private readonly levelState: AssessmentLevelStateLike;

  private readonly isLevelEligible: boolean;
  private readonly assessmentPuzzleTrigger: number;
  private readonly configuredAssessmentLevelIndexes: number[];
  private readonly assessmentTypeForCurrentLevel: string | null;

  private hasShownAssessmentThisLevel: boolean = false;
  private hasCompletedAssessmentThisRun: boolean = false;

  constructor(
    options: AssessmentFlowCoordinatorOptions,
    dependencies: AssessmentFlowCoordinatorDependencies = {}
  ) {
    this.currentLevelIndex = options.currentLevelIndex;
    this.totalLevels = options.totalLevels;
    this.puzzleCount = options.puzzleCount;
    this.miniGamePuzzleSegment = options.miniGamePuzzleSegment;
    this.refreshConfig = options.refreshConfig ?? true;
    this.randomFn = options.randomFn || Math.random;

    this.levelConfig = dependencies.levelConfig || new AssessmentLevelConfig();
    this.levelState = dependencies.levelState || new AssessmentLevelState();

    const isConfiguredLevel = this.levelConfig.shouldShowAtLevel(
      this.currentLevelIndex,
      this.totalLevels,
      this.refreshConfig
    );
    const shouldShowForLevel = this.levelState.shouldShowForLevel(this.currentLevelIndex);

    this.isLevelEligible = isConfiguredLevel && shouldShowForLevel;
    this.configuredAssessmentLevelIndexes = this.resolveConfiguredAssessmentLevelIndexes();
    this.assessmentTypeForCurrentLevel = this.resolveAssessmentTypeForCurrentLevel();
    this.assessmentPuzzleTrigger = this.resolveAssessmentPuzzleTrigger();
  }

  /**
   * Returns configured assessment level indexes (0-based) resolved from dynamic config.
   */
  public getConfiguredAssessmentLevelIndexes(): number[] {
    return [...this.configuredAssessmentLevelIndexes];
  }

  /**
   * Returns configured assessment type for the current level.
   */
  public getAssessmentTypeForCurrentLevel(): string | null {
    return this.assessmentTypeForCurrentLevel;
  }

  /**
   * Returns the selected puzzle segment (1-based) where assessment should
   * appear. Returns 0 when assessment is not eligible in this level.
   */
  public getAssessmentPuzzleTrigger(): number {
    return this.assessmentPuzzleTrigger;
  }

  /**
   * Returns whether assessment is eligible for this level before per-puzzle checks.
   */
  public isAssessmentEligibleForCurrentLevel(): boolean {
    return this.isLevelEligible;
  }

  /**
   * Returns true when assessment should start on this puzzle segment.
   */
  public shouldStartAssessmentAtPuzzle(puzzleNumber: number): boolean {
    if (!Number.isInteger(puzzleNumber) || puzzleNumber < 1) {
      return false;
    }

    if (!this.isLevelEligible || this.assessmentPuzzleTrigger < 1) {
      return false;
    }

    if (this.hasShownAssessmentThisLevel) {
      return false;
    }

    return puzzleNumber === this.assessmentPuzzleTrigger;
  }

  /**
   * Marks assessment as started for the current level run.
   */
  public startAssessment(): void {
    this.hasShownAssessmentThisLevel = true;
  }

  /**
   * Marks assessment completed and persists completion for current level.
   */
  public handleAssessmentCompleted(): void {
    this.hasShownAssessmentThisLevel = true;
    this.hasCompletedAssessmentThisRun = true;
    this.levelState.markAssessmentCompletedForLevel(this.currentLevelIndex);
  }

  /**
   * Handles close event. Intentionally no-op for persistence; completion is
   * persisted only from handleAssessmentCompleted().
   */
  public handleAssessmentClosed(): void {
    // no-op for now, flow resume is handled by gameplay integration.
  }

  /**
   * Returns whether assessment was completed in the current level run.
   */
  public isAssessmentCompletedThisRun(): boolean {
    return this.hasCompletedAssessmentThisRun;
  }

  private resolveAssessmentPuzzleTrigger(): number {
    if (!this.isLevelEligible || this.puzzleCount < 1) {
      return 0;
    }

    const firstAssessmentPuzzleSegment = Math.min(
      MIN_ASSESSMENT_PUZZLE_SEGMENT,
      this.puzzleCount
    );
    const lastAssessmentPuzzleSegment = Math.min(
      MAX_ASSESSMENT_PUZZLE_SEGMENT,
      this.puzzleCount
    );

    if (
      Number.isInteger(this.miniGamePuzzleSegment)
      && this.miniGamePuzzleSegment >= firstAssessmentPuzzleSegment
      && this.miniGamePuzzleSegment <= lastAssessmentPuzzleSegment
    ) {
      return this.miniGamePuzzleSegment;
    }

    const boundedRandom = Math.min(0.999999, Math.max(0, this.randomFn()));
    const assessmentPuzzleRange =
      lastAssessmentPuzzleSegment - firstAssessmentPuzzleSegment + 1;

    return Math.floor(boundedRandom * assessmentPuzzleRange) + firstAssessmentPuzzleSegment;
  }

  private resolveConfiguredAssessmentLevelIndexes(): number[] {
    if (typeof this.levelConfig.getTargetLevelIndexes !== 'function') {
      return [];
    }

    return this.levelConfig.getTargetLevelIndexes(this.totalLevels, false);
  }

  private resolveAssessmentTypeForCurrentLevel(): string | null {
    if (typeof this.levelConfig.getAssessmentTypeForLevel !== 'function') {
      return null;
    }

    return this.levelConfig.getAssessmentTypeForLevel(
      this.currentLevelIndex,
      this.totalLevels,
      false
    );
  }
}
