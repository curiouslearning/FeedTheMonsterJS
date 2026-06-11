import { AssessmentFlowCoordinator } from './assessment-flow-coordinator';

class MockAssessmentLevelConfig {
  constructor(private readonly configuredLevels: Map<number, string>) {}

  public shouldShowAtLevel(levelIndex: number): boolean {
    return this.configuredLevels.has(levelIndex);
  }

  public getTargetLevelIndexes(): number[] {
    return [...this.configuredLevels.keys()];
  }

  public getAssessmentTypeForLevel(levelIndex: number): string | null {
    return this.configuredLevels.get(levelIndex) || null;
  }
}

class MockAssessmentLevelState {
  public readonly completedAssessments = new Set<number>();
  public readonly blockedLevels = new Set<number>();

  public shouldShowForLevel(levelIndex: number): boolean {
    return !this.blockedLevels.has(levelIndex);
  }

  public markAssessmentCompletedForLevel(levelIndex: number): void {
    this.completedAssessments.add(levelIndex);
  }
}

describe('AssessmentFlowCoordinator', () => {
  it('uses mini-game segment when mini-game exists', () => {
    const coordinator = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 4,
        randomFn: () => 0,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'lettersounds']])),
        levelState: new MockAssessmentLevelState(),
      }
    );

    expect(coordinator.getAssessmentTypeForCurrentLevel()).toBe('lettersounds');
    expect(coordinator.getAssessmentPuzzleTrigger()).toBe(4);
    expect(coordinator.shouldStartAssessmentAtPuzzle(4)).toBe(true);
    expect(coordinator.shouldStartAssessmentAtPuzzle(3)).toBe(false);
  });

  it('uses random segment from puzzles 2 through 4 when mini-game does not exist', () => {
    const coordinator = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 0,
        randomFn: () => 0.6,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'sightwords']])),
        levelState: new MockAssessmentLevelState(),
      }
    );

    expect(coordinator.getAssessmentTypeForCurrentLevel()).toBe('sightwords');
    expect(coordinator.getAssessmentPuzzleTrigger()).toBe(3);
  });

  it('uses mini-game segment when mini-game is outside the random assessment window', () => {
    const coordinator = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 5,
        randomFn: () => 0.999,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'sightwords']])),
        levelState: new MockAssessmentLevelState(),
      }
    );

    expect(coordinator.getAssessmentPuzzleTrigger()).toBe(5);
    expect(coordinator.shouldStartAssessmentAtPuzzle(5)).toBe(true);
    expect(coordinator.shouldStartAssessmentAtPuzzle(4)).toBe(false);
  });

  it('uses mini-game segment when mini-game is on the first puzzle', () => {
    const coordinator = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 1,
        randomFn: () => 0.999,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'sightwords']])),
        levelState: new MockAssessmentLevelState(),
      }
    );

    expect(coordinator.getAssessmentPuzzleTrigger()).toBe(1);
    expect(coordinator.shouldStartAssessmentAtPuzzle(1)).toBe(true);
    expect(coordinator.shouldStartAssessmentAtPuzzle(2)).toBe(false);
  });

  it('opens assessment once per level run', () => {
    const coordinator = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 2,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'lettersounds']])),
        levelState: new MockAssessmentLevelState(),
      }
    );

    expect(coordinator.shouldStartAssessmentAtPuzzle(2)).toBe(true);

    coordinator.startAssessment();

    expect(coordinator.shouldStartAssessmentAtPuzzle(2)).toBe(false);
  });

  it('completion still allows reopening on replay', () => {
    const levelState = new MockAssessmentLevelState();

    const firstRun = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 1,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'lettersounds']])),
        levelState,
      }
    );

    expect(firstRun.shouldStartAssessmentAtPuzzle(1)).toBe(true);

    firstRun.startAssessment();
    firstRun.handleAssessmentCompleted();

    const replayRun = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 1,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'lettersounds']])),
        levelState,
      }
    );

    expect(replayRun.isAssessmentEligibleForCurrentLevel()).toBe(true);
    expect(replayRun.getAssessmentPuzzleTrigger()).toBe(1);
    expect(replayRun.shouldStartAssessmentAtPuzzle(1)).toBe(true);
  });

  it('explicit blocked state prevents reopening', () => {
    const levelState = new MockAssessmentLevelState();
    levelState.blockedLevels.add(2);

    const coordinator = new AssessmentFlowCoordinator(
      {
        currentLevelIndex: 2,
        totalLevels: 20,
        puzzleCount: 5,
        miniGamePuzzleSegment: 1,
      },
      {
        levelConfig: new MockAssessmentLevelConfig(new Map([[2, 'lettersounds']])),
        levelState,
      }
    );

    expect(coordinator.isAssessmentEligibleForCurrentLevel()).toBe(false);
    expect(coordinator.getAssessmentPuzzleTrigger()).toBe(0);
    expect(coordinator.shouldStartAssessmentAtPuzzle(1)).toBe(false);
  });
});
