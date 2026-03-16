import { lang } from '@common';
import { GameScore } from '@data';

interface StoredCompletedLevels {
  completedLevelIndexes: number[];
}

interface CompletedLevelInfo {
  levelNumber?: number;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type CompletedLevelsProvider = () => CompletedLevelInfo[];

export interface AssessmentLevelStateOptions {
  language?: string;
  storageKeyPrefix?: string;
  storage?: StorageLike;
  completedLevelsProvider?: CompletedLevelsProvider;
}

const DEFAULT_STORAGE_KEY_PREFIX = 'assessmentLevelState';

function isValidLevelIndex(levelIndex: number): boolean {
  return Number.isInteger(levelIndex) && levelIndex >= 0;
}

function uniqueSorted(levelIndexes: number[]): number[] {
  return [...new Set(levelIndexes)].sort((left, right) => left - right);
}

/**
 * Tracks per-language assessment completion state and combines it with
 * game-level completion from GameScore to decide whether an assessment
 * should still be shown for a level.
 */
export class AssessmentLevelState {
  private readonly language: string;
  private readonly storageKeyPrefix: string;
  private readonly storage: StorageLike;
  private readonly completedLevelsProvider: CompletedLevelsProvider;

  constructor(options: AssessmentLevelStateOptions = {}) {
    this.language = options.language || lang;
    this.storageKeyPrefix = options.storageKeyPrefix || DEFAULT_STORAGE_KEY_PREFIX;
    this.storage = options.storage || localStorage;
    this.completedLevelsProvider = options.completedLevelsProvider || (() => GameScore.getAllGameLevelInfo());
  }

  /**
   * Returns whether the assessment was completed on this level for this language.
   */
  public isAssessmentCompletedForLevel(levelIndex: number): boolean {
    if (!isValidLevelIndex(levelIndex)) {
      return false;
    }

    return this.getCompletedAssessmentLevelIndexes().includes(levelIndex);
  }

  /**
   * Persists assessment completion for a level in language-scoped local storage.
   */
  public markAssessmentCompletedForLevel(levelIndex: number): void {
    if (!isValidLevelIndex(levelIndex)) {
      return;
    }

    const completedLevelIndexes = this.getCompletedAssessmentLevelIndexes();
    const nextCompletedLevelIndexes = uniqueSorted([...completedLevelIndexes, levelIndex]);

    this.storage.setItem(
      this.getStorageKey(),
      JSON.stringify({ completedLevelIndexes: nextCompletedLevelIndexes } as StoredCompletedLevels)
    );
  }

  /**
   * Returns whether gameplay progression has completed this level already.
   */
  public isLevelCompleted(levelIndex: number): boolean {
    if (!isValidLevelIndex(levelIndex)) {
      return false;
    }

    const completedLevels = this.completedLevelsProvider();

    return completedLevels.some((level) => level?.levelNumber === levelIndex);
  }

  /**
   * Core Phase 2 gate:
   * show assessment only if the level is not completed and assessment
   * is not yet completed for that level.
   */
  public shouldShowForLevel(levelIndex: number): boolean {
    if (!isValidLevelIndex(levelIndex)) {
      return false;
    }

    if (this.isLevelCompleted(levelIndex)) {
      return false;
    }

    return !this.isAssessmentCompletedForLevel(levelIndex);
  }

  /**
   * Utility mainly for tests and reset workflows.
   */
  public clearAssessmentCompletionState(): void {
    this.storage.removeItem(this.getStorageKey());
  }

  private getStorageKey(): string {
    return `${this.storageKeyPrefix}:${this.language.toLowerCase()}`;
  }

  private getCompletedAssessmentLevelIndexes(): number[] {
    const rawStoredState = this.storage.getItem(this.getStorageKey());
    if (!rawStoredState) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawStoredState) as StoredCompletedLevels;
      if (!Array.isArray(parsed?.completedLevelIndexes)) {
        return [];
      }

      const validLevelIndexes = parsed.completedLevelIndexes.filter((levelIndex) =>
        isValidLevelIndex(levelIndex)
      );

      return uniqueSorted(validLevelIndexes);
    } catch {
      return [];
    }
  }
}
