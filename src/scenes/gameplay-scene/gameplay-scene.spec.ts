import {GameplayScene} from './gameplay-scene';
import gameStateService from '@gameStateService';

// Mocking dependencies
jest.mock('@components', () => {
  const BackgroundHtmlGenerator = jest.fn().mockImplementation(() => ({
    generateBackground: jest.fn(),
  }));

  (BackgroundHtmlGenerator as any).createBackgroundComponent = jest
    .fn()
    .mockReturnValue('summer');

  return {
    AudioPlayer: jest.fn().mockImplementation(() => ({
      stopAllAudios: jest.fn(),
      playAudio: jest.fn(),
      playPromptAudio: jest.fn(),
      playFeedbackAudios: jest.fn(),
      stopFeedbackAudio: jest.fn(),
      audioContext: {} as AudioContext,
      sourceNode: {} as AudioBufferSourceNode,
      audioQueue: [],
      promptAudioBuffer: null,
      playBackgroundMusic: jest.fn()
    })),
    TrailEffect: jest.fn().mockImplementation(() => ({
      addTrailParticlesOnMove: jest.fn(),
      clearTrailSubscription: jest.fn(),
      draw: jest.fn(),
      resetParticles: jest.fn()
    })),
    PauseButton: jest.fn().mockImplementation(() => ({
      onClick: jest.fn(),
      dispose: jest.fn(),
    })),
    TimerTicking: jest.fn().mockImplementation(() => ({
      startTimer: jest.fn(),
      destroy: jest.fn(),
    })),
    StoneHandler: jest.fn().mockImplementation(() => ({
      draw: jest.fn(),
      dispose: jest.fn(),
      isStoneLetterDropCorrect: jest.fn(),
      resetStonePosition: jest.fn(),
      handlePickStoneUp: jest.fn(),
      handleMovingStoneLetter: jest.fn(),
      getCorrectTargetStone: jest.fn().mockReturnValue('MockedTargetStone'),
      getFoilStones: jest.fn().mockReturnValue(['FoilStone1', 'FoilStone2']),
      stones: [],
      foilStones: [],
      isGamePaused: false,
      context: {} as CanvasRenderingContext2D,
      canvas: document.createElement('canvas'),
      currentPuzzleData: {},
      targetStones: [],
      stonePos: { x: 0, y: 0 },
      pickedStone: null,
      playDragAudioIfNecessary: jest.fn()
    })),
    Tutorial: jest.fn().mockImplementation(() => ({
      clickOnMonsterTutorial: jest.fn(),
      draw: jest.fn(),
      dispose: jest.fn(),
      initialize: jest.fn(),
      width: 800,
      height: 600,
      context: {} as CanvasRenderingContext2D,
      tutorialImg: new Image(),
      play: jest.fn(),
      stop: jest.fn(),
      setPlayMonsterClickAnimation: jest.fn()
    })),
    PromptText: jest.fn().mockImplementation(() => ({
      draw: jest.fn(),
      onClick: jest.fn(),
      playSound: jest.fn(),
      dispose: jest.fn(),
    })),
    LevelIndicators: jest.fn().mockImplementation(() => ({
      setIndicators: jest.fn(),
      dispose: jest.fn(),
    })),
    Monster: jest.fn().mockImplementation(() => ({
      changeToIdleAnimation: jest.fn(),
      dispose: jest.fn(),
      onClick: jest.fn(),
      play: jest.fn(),
      checkHitboxDistance: jest.fn()
    })),
    FeedbackTextEffects: jest.fn().mockImplementation(() => ({
      wrapText: jest.fn(),
      hideText: jest.fn()
    })),
    BackgroundHtmlGenerator,
    RiveMonsterComponent: jest.fn().mockImplementation(() => ({
      dispose: jest.fn(),
      play: jest.fn(),
      checkHitboxDistance: jest.fn(),
      onClick: jest.fn()
    }))
  };
});

jest.mock('@gameStateService', () => ({
  __esModule: true,
  default: {
    getGamePlaySceneDetails: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    EVENTS: {
      GAME_PAUSE_STATUS_EVENT: 'GAME_PAUSE_STATUS_EVENT',
      GAMEPLAY_DATA_EVENT: 'GAMEPLAY_DATA_EVENT',
      SCENE_LOADING_EVENT: 'SCENE_LOADING_EVENT'
    }
  }
}));

describe('GameplayScene with BasePopupComponent', () => {
  let gameplayScene: GameplayScene;
  let mockSwitchSceneToEnd: jest.Mock;
  let mockReloadScene: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock DOM elements, including the expected popup root and version-info-id
    document.body.innerHTML = `
      <div class="game-scene"></div>
      <div id="canvas"></div>
      <canvas id="rivecanvas"></canvas>
      <canvas id="game-control"></canvas>
      <div id="popup-root"></div>
      <div id="version-info-id">1.0.0</div>
    `;

    const mockCanvas = document.getElementById('canvas') as HTMLCanvasElement;
    mockCanvas.getContext = jest.fn().mockReturnValue({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
    });

    (gameStateService.getGamePlaySceneDetails as jest.Mock).mockReturnValue({
      canvas: mockCanvas,
      width: 800,
      height: 600,
      levelData: {
        levelMeta: {levelNumber: 1},
        puzzles: [{}, {}, {}], // 3 puzzles for testing
      },
      levelNumber: 1,
      feedBackTexts: {0: 'Great!', 1: 'Fantastic!', 2: 'Amazing!'},
      isGamePaused: false,
      gameCanvasContext: mockCanvas.getContext('2d'),
      rightToLeft: false,
      jsonVersionNumber: '1.0.0',
      data: {},
      feedbackAudios: {}
    });

    mockSwitchSceneToEnd = jest.fn();
    mockReloadScene = jest.fn();

    // Initialize GameplayScene
    gameplayScene = new GameplayScene({
      switchSceneToEnd: mockSwitchSceneToEnd,
      switchToLevelSelection: jest.fn(),
      reloadScene: mockReloadScene,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should call switchSceneToEnd immediately (0ms) when timerEnded is true or !isFeedBackTriggered is true', () => {
    // Arrange
    gameplayScene.counter = 2; // Last puzzle index
    gameplayScene.isFeedBackTriggered = false; // Feedback not triggered
    const timerEnded = true; // Simulate timer has ended

    // Act
    gameplayScene.loadPuzzle(timerEnded);

    // Force immediate execution of timers
    jest.runAllTimers();

    // Assert
    expect(mockSwitchSceneToEnd).toHaveBeenCalledTimes(1); // Should be called immediately
  });

  it('should call switchSceneToEnd after 4500ms when timerEnded is false or isFeedBackTriggered is true', () => {
    // Arrange
    gameplayScene.counter = 2; // Last puzzle index
    gameplayScene.isFeedBackTriggered = true; // Feedback is triggered
    const timerEnded = false; // Timer has not ended

    // Act
    gameplayScene.loadPuzzle(timerEnded);

    // Assert: Ensure it is not called immediately
    expect(mockSwitchSceneToEnd).not.toHaveBeenCalled();

    // Advance time by 4500ms
    jest.advanceTimersByTime(4500);

    // Assert
    expect(mockSwitchSceneToEnd).toHaveBeenCalledTimes(1); // Called after 4500ms
  });

  it('should call switchSceneToEnd after 4500ms when timerEnded is false and isFeedBackTriggered is false', () => {
    // Arrange
    gameplayScene.counter = 2;
    gameplayScene.isFeedBackTriggered = false; // Feedback not triggered
    const timerEnded = false; // Timer not ended

    // Act
    gameplayScene.loadPuzzle(timerEnded);

    // Assert: Ensure no call before 4500ms
    jest.advanceTimersByTime(4499);
    expect(mockSwitchSceneToEnd).not.toHaveBeenCalled();

    // Advance time to 4500ms
    jest.advanceTimersByTime(1);

    // Assert: Now it should be called
    expect(mockSwitchSceneToEnd).toHaveBeenCalledTimes(1);
  });

  describe('Component Initialization', () => {
    it('should properly initialize components with correct dependencies', () => {
      // Verify StoneHandler initialization
      expect(gameplayScene.stoneHandler).toBeDefined();
      expect(gameplayScene.stoneHandler.context).toBeDefined();
      expect(gameplayScene.stoneHandler.canvas).toBeDefined();

      // Verify Tutorial initialization
      expect(gameplayScene.tutorial).toBeDefined();
      expect(gameplayScene.tutorial.context).toBeDefined();
      expect(gameplayScene.tutorial.width).toBe(800);
      expect(gameplayScene.tutorial.height).toBe(600);
    });

    it('should initialize AudioPlayer independently', () => {
      expect(gameplayScene.audioPlayer).toBeDefined();
      expect(gameplayScene.audioPlayer.stopAllAudios).toBeDefined();
      expect(gameplayScene.audioPlayer.playPromptAudio).toBeDefined();
      expect(gameplayScene.audioPlayer.playFeedbackAudios).toBeDefined();
    });

    it('should properly set up game state subscriptions', () => {
      expect(gameStateService.subscribe).toHaveBeenCalledWith(
        gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
        expect.any(Function)
      );
    });
  });

  describe('Game State Management', () => {
    it('should handle pause state correctly', () => {
      // Mock the event subscription
      const pauseStatusCallback = (gameStateService.subscribe as jest.Mock).mock.calls.find(
        call => call[0] === gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT
      )[1];

      // Simulate game pause
      pauseStatusCallback(true);
      expect(gameplayScene.isPauseButtonClicked).toBe(true);

      // Simulate game resume
      pauseStatusCallback(false);
      expect(gameplayScene.isPauseButtonClicked).toBe(false);
    });

    it('should clean up resources on dispose', () => {
      // Initialize with mock components
      const mockStoneHandler = {
        dispose: jest.fn(),
        stones: []
      };
      const mockAudioPlayer = {
        stopAllAudios: jest.fn()
      };
      const mockMonster = {
        dispose: jest.fn(),
        play: jest.fn(),
        checkHitboxDistance: jest.fn(),
        onClick: jest.fn()
      };
      const mockTrailParticles = {
        clearTrailSubscription: jest.fn()
      };
      const mockLevelIndicators = {
        dispose: jest.fn()
      };
      const mockPromptText = {
        dispose: jest.fn()
      };
      const mockPauseButton = {
        dispose: jest.fn()
      };
      const mockPausePopup = {
        destroy: jest.fn()
      };

      // Replace the actual components with mocks
      gameplayScene.stoneHandler = mockStoneHandler as any;
      gameplayScene.audioPlayer = mockAudioPlayer as any;
      gameplayScene.monster = mockMonster as any;
      gameplayScene.trailParticles = mockTrailParticles as any;
      gameplayScene.levelIndicators = mockLevelIndicators as any;
      gameplayScene.promptText = mockPromptText as any;
      gameplayScene.pauseButton = mockPauseButton as any;
      gameplayScene.pausePopupComponent = mockPausePopup as any;

      // Call dispose
      gameplayScene.dispose();

      // Verify cleanup
      expect(mockStoneHandler.dispose).toHaveBeenCalled();
      expect(mockAudioPlayer.stopAllAudios).toHaveBeenCalled();
      expect(mockMonster.dispose).toHaveBeenCalled();
      expect(mockTrailParticles.clearTrailSubscription).toHaveBeenCalled();
      expect(mockLevelIndicators.dispose).toHaveBeenCalled();
      expect(mockPromptText.dispose).toHaveBeenCalled();
      expect(mockPauseButton.dispose).toHaveBeenCalled();
      expect(mockPausePopup.destroy).toHaveBeenCalled();
      expect(gameplayScene.isDisposing).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should handle visibility change event', () => {
      const mockAudioPlayer = {
        stopAllAudios: jest.fn()
      };
      gameplayScene.audioPlayer = mockAudioPlayer as any;

      // Simulate visibility change
      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockAudioPlayer.stopAllAudios).toHaveBeenCalled();
      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
        true
      );
    });

    it('should handle pause popup events', () => {
      const mockEvent = { data: 'RESTART_LEVEL' };
      
      // Mock the pause popup component
      const mockPausePopup = {
        onClose: jest.fn()
      };
      gameplayScene.pausePopupComponent = mockPausePopup as any;

      // Get the callback that would be registered
      const onCloseCallback = (props: any) => {
        if (props.data === 'RESTART_LEVEL') {
          gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, {});
          gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
          mockReloadScene('GamePlay');
        }
      };

      // Call the callback with the mock event
      onCloseCallback(mockEvent);

      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.GAMEPLAY_DATA_EVENT,
        expect.any(Object)
      );
      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.SCENE_LOADING_EVENT,
        true
      );
      expect(mockReloadScene).toHaveBeenCalledWith('GamePlay');
    });
  });
});
