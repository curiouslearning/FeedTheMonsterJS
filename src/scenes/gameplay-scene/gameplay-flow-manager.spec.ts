const mockAssessmentCoordinator = {
  shouldStartAssessmentAtPuzzle: jest.fn(),
  startAssessment: jest.fn(),
  handleAssessmentCompleted: jest.fn(),
  handleAssessmentClosed: jest.fn(),
  getConfiguredAssessmentLevelIndexes: jest.fn(() => []),
  getAssessmentTypeForCurrentLevel: jest.fn(() => null),
  isAssessmentEligibleForCurrentLevel: jest.fn(() => false),
  getAssessmentPuzzleTrigger: jest.fn(() => 0),
};

jest.mock('../../analytics/analytics-integration', () => ({
  AnalyticsIntegration: {
    getInstance: jest.fn(() => ({
      track: jest.fn(),
    })),
  },
  AnalyticsEventType: {
    PUZZLE_COMPLETED: 'PUZZLE_COMPLETED',
    LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  },
}));

jest.mock('@components', () => ({
  AudioPlayer: {
    playAudio: jest.fn(),
  },
  StoneHandler: jest.fn(),
}));

jest.mock('@gameStateService', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
    shouldDisplayProgressJar: jest.fn(() => false),
    EVENTS: {
      LOAD_NEXT_GAME_PUZZLE: 'LOAD_NEXT_GAME_PUZZLE',
      LEVEL_END_DATA_EVENT: 'LEVEL_END_DATA_EVENT',
      SWITCH_SCENE_EVENT: 'SWITCH_SCENE_EVENT',
    },
  },
}));

jest.mock('@miniGameStateService', () => ({
  __esModule: true,
  default: {
    shouldShowMiniGame: jest.fn(() => 0),
    publish: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    EVENTS: {
      MINI_GAME_WILL_START: 'MINI_GAME_WILL_START',
      IS_MINI_GAME_DONE: 'IS_MINI_GAME_DONE',
    },
  },
}));

jest.mock('@assessment/assessment-survey-manager', () => ({
  __esModule: true,
  default: {
    open: jest.fn(),
  },
}));

jest.mock('@assessment/assessment-flow-coordinator', () => ({
  AssessmentFlowCoordinator: jest.fn().mockImplementation(() => mockAssessmentCoordinator),
}));

import gameStateService from '@gameStateService';
import miniGameStateService from '@miniGameStateService';
import assessmentSurveyManager from '@assessment/assessment-survey-manager';
import { AssessmentFlowCoordinator } from '@assessment/assessment-flow-coordinator';
import { GameplayFlowManager } from './gameplay-flow-manager';

function createFlowManager(levelDataOverrides: Partial<any> = {}) {
  const baseLevelData = {
    levelNumber: 2,
    levelMeta: {
      levelNumber: 2,
      levelType: 'LetterOnly',
    },
    puzzles: [{}, {}, {}],
  };

  const levelData = {
    ...baseLevelData,
    ...levelDataOverrides,
    levelMeta: {
      ...baseLevelData.levelMeta,
      ...(levelDataOverrides.levelMeta || {}),
    },
  } as any;

  const data = {
    levels: Array.from({ length: 20 }, (_, levelNumber) => ({
      levelMeta: { levelNumber },
      puzzles: [{}],
    })),
  } as any;

  const monsterController = {
    playSuccessAnimation: jest.fn(),
    playFailureAnimation: jest.fn(),
    resetForNextPuzzle: jest.fn(),
    dispose: jest.fn(),
  } as any;

  const uiManager = {
    updateStars: jest.fn(),
    startTimer: jest.fn(),
  } as any;

  const puzzleHandler = {
    initialize: jest.fn(),
    getWordPuzzleDroppedLetters: jest.fn(),
  } as any;

  const stoneHandler = {
    getCorrectTargetStone: jest.fn(() => 'target'),
    getFoilStones: jest.fn(() => ['foilA', 'foilB']),
  } as any;

  const miniGameHandler = {
    start: jest.fn(),
  } as any;

  const tutorial = {
    hideTutorial: jest.fn(),
    resetTutorialTimer: jest.fn(),
    resetQuickStartTutorialDelay: jest.fn(),
  } as any;

  const manager = new GameplayFlowManager(
    levelData,
    data,
    'test-json-version',
    monsterController,
    uiManager,
    puzzleHandler,
    stoneHandler,
    miniGameHandler,
    tutorial
  );

  return {
    manager,
    miniGameHandler,
  };
}

describe('GameplayFlowManager assessment integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAssessmentCoordinator.shouldStartAssessmentAtPuzzle.mockReset();
    mockAssessmentCoordinator.startAssessment.mockReset();
    mockAssessmentCoordinator.handleAssessmentCompleted.mockReset();
    mockAssessmentCoordinator.handleAssessmentClosed.mockReset();
    mockAssessmentCoordinator.getConfiguredAssessmentLevelIndexes.mockReset();
    mockAssessmentCoordinator.getConfiguredAssessmentLevelIndexes.mockReturnValue([]);
    mockAssessmentCoordinator.getAssessmentTypeForCurrentLevel.mockReset();
    mockAssessmentCoordinator.getAssessmentTypeForCurrentLevel.mockReturnValue(null);
    mockAssessmentCoordinator.isAssessmentEligibleForCurrentLevel.mockReset();
    mockAssessmentCoordinator.isAssessmentEligibleForCurrentLevel.mockReturnValue(false);
    mockAssessmentCoordinator.getAssessmentPuzzleTrigger.mockReset();
    mockAssessmentCoordinator.getAssessmentPuzzleTrigger.mockReturnValue(0);

    (gameStateService.subscribe as jest.Mock).mockImplementation(() => jest.fn());
    (miniGameStateService.subscribe as jest.Mock).mockImplementation(() => jest.fn());
    (miniGameStateService.shouldShowMiniGame as jest.Mock).mockReturnValue(0);
  });

  it('runs assessment before mini-game on the same puzzle segment', () => {
    mockAssessmentCoordinator.shouldStartAssessmentAtPuzzle.mockReturnValue(true);
    mockAssessmentCoordinator.getAssessmentTypeForCurrentLevel.mockReturnValue('lettersounds');
    (miniGameStateService.shouldShowMiniGame as jest.Mock).mockReturnValue(1);

    (assessmentSurveyManager.open as jest.Mock).mockImplementation(async ({ onComplete, onRewardTrigger, onClose }) => {
      onComplete?.();
      onRewardTrigger?.({ type: 'assessment_completed', score: 200 });
      onClose?.();
    });

    const { manager, miniGameHandler } = createFlowManager();

    manager.determineNextStep(true, false);

    expect(mockAssessmentCoordinator.startAssessment).toHaveBeenCalledTimes(1);
    expect(mockAssessmentCoordinator.handleAssessmentCompleted).toHaveBeenCalledTimes(1);
    expect(mockAssessmentCoordinator.handleAssessmentClosed).toHaveBeenCalledTimes(1);
    expect(assessmentSurveyManager.open).toHaveBeenCalledWith(
      expect.objectContaining({ dataKey: 'lettersounds' })
    );
    expect(miniGameStateService.publish).toHaveBeenCalledWith(
      miniGameStateService.EVENTS.MINI_GAME_WILL_START,
      { level: 1 }
    );
    expect(miniGameHandler.start).toHaveBeenCalledTimes(1);

    const assessmentOpenOrder = (assessmentSurveyManager.open as jest.Mock).mock.invocationCallOrder[0];
    const miniGameStartOrder = (miniGameHandler.start as jest.Mock).mock.invocationCallOrder[0];
    expect(assessmentOpenOrder).toBeLessThan(miniGameStartOrder);

    manager.dispose();
  });

  it('resumes puzzle flow only after assessment closes', () => {
    mockAssessmentCoordinator.shouldStartAssessmentAtPuzzle.mockReturnValue(true);

    let closeHandler: (() => void) | undefined;
    (assessmentSurveyManager.open as jest.Mock).mockImplementation(async ({ onClose }) => {
      closeHandler = onClose;
    });

    const { manager } = createFlowManager();
    const continueAfterPuzzleStepSpy = jest.spyOn(manager as any, 'continueAfterPuzzleStep');

    manager.determineNextStep(false, false);

    expect(continueAfterPuzzleStepSpy).not.toHaveBeenCalled();

    closeHandler?.();

    expect(continueAfterPuzzleStepSpy).toHaveBeenCalledWith(1, false, 3000);
    expect(mockAssessmentCoordinator.handleAssessmentClosed).toHaveBeenCalledTimes(1);
    expect(mockAssessmentCoordinator.handleAssessmentCompleted).not.toHaveBeenCalled();

    manager.dispose();
  });

  it('prevents duplicate assessment open while one is already in progress', () => {
    mockAssessmentCoordinator.shouldStartAssessmentAtPuzzle.mockReturnValue(true);
    (assessmentSurveyManager.open as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { manager } = createFlowManager();

    manager.determineNextStep(false, false);
    manager.determineNextStep(false, false);

    expect(mockAssessmentCoordinator.startAssessment).toHaveBeenCalledTimes(1);
    expect(assessmentSurveyManager.open).toHaveBeenCalledTimes(1);

    manager.dispose();
  });

  it('normalizes string level index before gating checks', () => {
    (miniGameStateService.shouldShowMiniGame as jest.Mock).mockReturnValue(0);

    const { manager } = createFlowManager({
      levelNumber: '2',
      levelMeta: { levelNumber: 2 },
    });

    expect(miniGameStateService.shouldShowMiniGame).toHaveBeenCalledWith(
      expect.objectContaining({ gameLevel: 2 })
    );
    expect(AssessmentFlowCoordinator as unknown as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        currentLevelIndex: 2,
      })
    );

    manager.dispose();
  });
});
