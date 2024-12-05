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

  it('should call switchSceneToEnd after 2500ms when last puzzle is completed', () => {
    gameplayScene.counter = 2; // Last puzzle index
    gameplayScene.loadPuzzle();

    expect(mockSwitchSceneToEnd).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2500);

    expect(mockSwitchSceneToEnd).toHaveBeenCalledTimes(1);
  });
});
