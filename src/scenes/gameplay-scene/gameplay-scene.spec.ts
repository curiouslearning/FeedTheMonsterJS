import {GameplayScene} from './gameplay-scene';
import {AudioPlayer} from '@components';
import gameStateService from '@gameStateService';
import {AUDIO_PATH_ON_DRAG} from '@constants';

// Mocking dependencies
jest.mock('@components', () => {
  const BackgroundHtmlGenerator = jest.fn().mockImplementation(() => ({
    generateBackground: jest.fn(),
    createBackgroundGameplay: jest.fn(),
  }));

  // Attach the static method manually
  (BackgroundHtmlGenerator as any).createBackgroundComponent = jest
    .fn()
    .mockReturnValue('summer');

  return {
    AudioPlayer: jest.fn().mockImplementation(() => ({
      stopAllAudios: jest.fn(),
      playAudio: jest.fn(),
      stopFeedbackAudio: jest.fn(),
    })),
    TrailEffect: jest.fn().mockImplementation(() => ({
      addTrailParticlesOnMove: jest.fn(),
      clearTrailSubscription: jest.fn(),
      draw: jest.fn(),
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
      handlePickStoneUp: jest.fn(),
      handleMovingStoneLetter: jest.fn(),
      resetStonePosition: jest.fn(),
      foilStones: [
        {x: 100, y: 200}, // Mock data for foil stones
        {x: 150, y: 250},
      ],
    })),
    Tutorial: jest.fn().mockImplementation(() => ({
      setPlayMonsterClickAnimation: jest.fn(),
      clickOnMonsterTutorial: jest.fn(),
      dispose: jest.fn(),
    })),
    PromptText: jest.fn().mockImplementation(() => ({
      draw: jest.fn(),
      playSound: jest.fn(),
      dispose: jest.fn(),
      onClick: jest.fn(),
    })),
    LevelIndicators: jest.fn().mockImplementation(() => ({
      setIndicators: jest.fn(),
      dispose: jest.fn(),
    })),
    Monster: jest.fn().mockImplementation(() => ({
      changeToIdleAnimation: jest.fn(),
      dispose: jest.fn(),
    })),
    FeedbackTextEffects: jest.fn().mockImplementation(() => ({
      wrapText: jest.fn(),
    })),
    BackgroundHtmlGenerator,
  };
});

jest.mock('@gameStateService');

jest.mock('lodash-es/debounce', () =>
  jest.fn(fn => {
    return function (...args) {
      return fn(...args);
    };
  }),
);

describe('GameplayScene', () => {
  let gameplayScene: GameplayScene;
  let mockSwitchSceneToEnd: jest.Mock;
  let mockSwitchToLevelSelection: jest.Mock;
  let mockReloadScene: jest.Mock;
  let audioPlayerMock: jest.Mocked<AudioPlayer>;

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = `
      <div id="canvas"></div>
      <canvas id="rivecanvas" style="width: 390px; height: 844px;"></canvas>
      <div id="game-control"></div>
    `;

    (gameStateService.getGamePlaySceneDetails as jest.Mock).mockReturnValue({
      canvas: document.createElement('canvas'),
      width: 390,
      height: 844,
      gameCanvasContext: {} as CanvasRenderingContext2D,
      levelData: {
        puzzles: [
          {
            segmentNumber: 0,
            prompt: {promptText: 'b', promptAudio: 'mock-audio-url'},
            foilStones: ['m', 'b', 'a', 'b'],
            targetStones: ['b'],
          },
        ],
        levelMeta: {levelNumber: 20},
      },
      levelNumber: 20,
    });

    mockSwitchSceneToEnd = jest.fn();
    mockSwitchToLevelSelection = jest.fn();
    mockReloadScene = jest.fn();

    gameplayScene = new GameplayScene({
      monsterPhaseNumber: 1,
      switchSceneToEnd: mockSwitchSceneToEnd,
      switchToLevelSelection: mockSwitchToLevelSelection,
      reloadScene: mockReloadScene,
    });

    audioPlayerMock = new (jest.requireMock('@components').AudioPlayer)();
    gameplayScene.audioPlayer = audioPlayerMock;

    gameplayScene.pickedStone = {
      frame: 100, // Draggable stone
      text: 'A',
      x: 0,
      y: 0,
      origx: 0,
      origy: 0,
    } as any;

    gameplayScene.stoneHandler = {
      foilStones: [
        {x: 100, y: 200, frame: 100}, // Draggable stone
        {x: 150, y: 250, frame: 50}, // Non-draggable stone
      ],
      draw: jest.fn(),
      dispose: jest.fn(),
      handlePickStoneUp: jest.fn(),
      handleMovingStoneLetter: jest.fn(),
      resetStonePosition: jest.fn(),
    } as any;

    gameplayScene.setupBg = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = ''; // Clean up DOM
  });

  describe('Audio Behavior', () => {
    it('should play drag audio when a draggable stone is picked up', () => {
      const mockEvent = {
        clientX: 100, // Matches foilStones[0].x
        clientY: 200, // Matches foilStones[0].y
      } as MouseEvent;

      gameplayScene.handleMouseDown(mockEvent);

      // Verify playAudio was called with the correct path
      expect(audioPlayerMock.playAudio).toHaveBeenCalledWith(
        AUDIO_PATH_ON_DRAG,
      );
    });

    it('should not play drag audio when the stone frame is <= 99', () => {
      gameplayScene.pickedStone.frame = 99; // Make the stone non-draggable

      const mockEvent = {
        clientX: 100,
        clientY: 200,
      } as MouseEvent;

      gameplayScene.handleMouseDown(mockEvent);

      expect(audioPlayerMock.playAudio).not.toHaveBeenCalled();
    });
  });
});
