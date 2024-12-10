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
    })),
    TrailEffect: jest.fn().mockImplementation(() => ({
      addTrailParticlesOnMove: jest.fn(),
      clearTrailSubscription: jest.fn(),
      draw: jest.fn(),
    })),
    PauseButton: jest.fn().mockImplementation(() => ({
      onClick: jest.fn(),
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
      getCorrectTargetStone: jest.fn().mockReturnValue('MockedTargetStone'), // Mocked method
      getFoilStones: jest.fn().mockReturnValue(['FoilStone1', 'FoilStone2']), // Mocked method
    })),
    Tutorial: jest.fn().mockImplementation(() => ({
      play: jest.fn(),
      stop: jest.fn(),
      dispose: jest.fn(),
    })),
    PromptText: jest.fn().mockImplementation(() => ({
      draw: jest.fn(),
      onClick: jest.fn(),
      playSound: jest.fn(),
    })),
    LevelIndicators: jest.fn().mockImplementation(() => ({
      setIndicators: jest.fn(),
      dispose: jest.fn(),
    })),
    Monster: jest.fn().mockImplementation(() => ({
      changeToIdleAnimation: jest.fn(),
      dispose: jest.fn(),
      onClick: jest.fn(),
    })),
    FeedbackTextEffects: jest.fn().mockImplementation(() => ({
      wrapText: jest.fn(),
      dispose: jest.fn(),
    })),
    BackgroundHtmlGenerator,
  };
});

jest.mock('@gameStateService');

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
    });

    mockSwitchSceneToEnd = jest.fn();
    mockReloadScene = jest.fn();

    // Initialize GameplayScene
    gameplayScene = new GameplayScene({
      monsterPhaseNumber: 1,
      switchSceneToEnd: mockSwitchSceneToEnd,
      switchToLevelSelection: jest.fn(),
      reloadScene: mockReloadScene,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should call switchSceneToEnd immediately (0ms) when timerEnded is true and !isFeedBackTriggered is true', () => {
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
    gameplayScene.isFeedBackTriggered = true; // Feedback triggered
    const timerEnded = true; // Simulate timer has ended
  
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
    gameplayScene.counter = 2; // Last puzzle index
    gameplayScene.isFeedBackTriggered = false; // Feedback not triggered
    const timerEnded = false; // Timer not ended
  
    // Act
    gameplayScene.loadPuzzle(timerEnded);
  
    // Assert: Ensure it is not called immediately
    expect(mockSwitchSceneToEnd).not.toHaveBeenCalled();
  
    // Advance time by 4500ms
    jest.advanceTimersByTime(4500);
  
    // Assert
    expect(mockSwitchSceneToEnd).toHaveBeenCalledTimes(1); // Called after 4500ms
  });  
});
