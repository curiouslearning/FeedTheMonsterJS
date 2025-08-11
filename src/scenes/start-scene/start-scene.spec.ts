import { StartScene } from './start-scene';
import { PlayButtonHtml } from '@components/buttons';
import { AnalyticsIntegration } from "../../analytics/analytics-integration";
import { AudioPlayer } from "../../components/audio-player";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import { SCENE_NAME_LEVEL_SELECT } from "@constants";
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';

// Define mock implementation first
const mockInstance = {
  sendTappedStartEvent: jest.fn(),
  sendUserClickedOnPlayEvent: jest.fn(),
  isAnalyticsReady: jest.fn().mockReturnValue(true)
};

let mockInstanceRef = mockInstance;

// Mock the AnalyticsIntegration module before other imports
jest.mock("../../analytics/analytics-integration", () => ({
  AnalyticsIntegration: {
    initializeAnalytics: jest.fn().mockImplementation(async () => {
      mockInstanceRef = {
        sendTappedStartEvent: jest.fn(),
        sendUserClickedOnPlayEvent: jest.fn(),
        isAnalyticsReady: jest.fn().mockReturnValue(true)
      };
      return Promise.resolve();
    }),
    getInstance: jest.fn().mockImplementation(() => mockInstanceRef)
  }
}));

jest.mock('@rive-app/canvas', () => ({
  Rive: jest.fn().mockImplementation(() => ({
    cleanup: jest.fn(),
    play: jest.fn(),
    stop: jest.fn(),
    stateMachineInputs: jest.fn(),
    on: jest.fn(),
  })),
  Layout: jest.fn(),
  Fit: {
    Contain: 'contain',
    Cover: 'cover',
  },
  Alignment: {
    Center: 'center',
    Top: 'top',
  },
}));

jest.mock('@components/riveMonster/rive-monster-component', () => ({
  RiveMonsterComponent: jest.fn().mockImplementation(() => ({
    Rive: jest.fn().mockImplementation(() => ({}))
  })),
}));

// Mock implementations
let mockAnalyticsInstance: any;

jest.mock("../../components/audio-player", () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playButtonClickSound: jest.fn()
  })),
}));
jest.mock('@gameStateService', () => ({
  EVENTS: {
    SWITCH_SCENE_EVENT: 'SWITCH_SCENE_EVENT',
  },
  publish: jest.fn(),
  getFTMData: jest.fn(),
}));
jest.mock('@gameSettingsService', () => ({
  __esModule: true,
  default: {
    getCanvasSizeValues: jest.fn(),
    getRiveCanvasValue: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    EVENTS: {
      GAME_TRAIL_EFFECT_TOGGLE_EVENT: 'GAME_TRAIL_EFFECT_TOGGLE_EVENT',
    },
    getDevicePixelRatioValue: jest.fn()
  }
}));


describe('Start Scene Test', () => {
  let startScene;
  let mockPlayBtn;
  let mockOnClickCallback;
  let mockAnalytics;
  let mockAudioPlayer;
  const switchSceneMockFunc = jest.fn();

  beforeEach(async () => {
    document.body.innerHTML = `
      <div>
        <div id="title-and-play-button"></div>
        <button id="toggle-btn" class="off">Dev</button>
        <div id="loading-screen" style="display: none; z-index: -1;"></div>
        <div class="game-scene"></div>
        <div id="canvas"></div>
        <div id="background"></div>
        <canvas id="rivecanvas"></canvas>
        <canvas id="game-control"></canvas>
        <div id="popup-root"></div>
        <div id="version-info-id">1.0.0</div>
        <div id="start-scene-click-area"></div>
      </div>
    `;

    // Initialize Analytics mock with fresh instance
    await AnalyticsIntegration.initializeAnalytics();
    mockAnalytics = AnalyticsIntegration.getInstance();

    //Mock Audio Player instance
    mockAudioPlayer = new AudioPlayer();

    const mockCanvas = document.getElementById('canvas') as HTMLCanvasElement;
    const mockRiveCanvas = document.getElementById("rivecanvas") as HTMLCanvasElement;

    (gameStateService.getFTMData as jest.Mock).mockReturnValue({
      data: {levelData: {
        levelMeta: { levelNumber: 1 },
        puzzles: [{}, {}, {}], // 3 puzzles for testing
      },
      levelNumber: 1,
      feedBackTexts: { 0: 'Great!', 1: 'Fantastic!', 2: 'Amazing!' },
      isGamePaused: false,
      rightToLeft: false,
      jsonVersionNumber: '1.0.0',
      data: {},
      feedbackAudios: {}}
    });

    (gameSettingsService.getCanvasSizeValues as jest.Mock).mockReturnValue({
      canvasElem: mockCanvas,
      canvasWidth: 800,
      canvasHeight: 600,
      gameControlElem: document.getElementById("game-control") as HTMLCanvasElement
    });

    (gameSettingsService.getRiveCanvasValue as jest.Mock).mockReturnValue(mockRiveCanvas);

    // Create the startScene instance
    startScene = new StartScene();

    // Initialize required elements
    startScene.titleTextElement = document.getElementById('title');
    startScene.handler = document.getElementById('start-scene-click-area');
    startScene.toggleBtn = document.getElementById('toggle-btn');

    // Ensure startScene uses the mock data
    startScene.analyticsIntegration = mockAnalytics;
    startScene.audioPlayer = mockAudioPlayer;

    // Create the play button and mock the callback
    mockPlayBtn = {
      onClick: jest.fn((callback) => {
        mockOnClickCallback = callback;
      }),
    } as unknown as jest.Mocked<PlayButtonHtml>;

    // Mock PlayButtonHtml to return the mocked button
    (PlayButtonHtml as jest.Mock) = jest.fn(() => mockPlayBtn);

    // Create the play button
    startScene.createPlayButton();
  });

  describe('During start scene initialization.', () => {
    it('It should hide the initial loading screen once start scene has fully loaded.', () => {
      const loadingElement = document.getElementById("loading-screen");

      expect(loadingElement.style.zIndex).toEqual("-1");
      expect(loadingElement.style.display).toEqual("none");
    });

    it('Should add title-long class when title length exceeds 20 characters', () => {
      const titleElement = document.getElementById("title");
      expect(titleElement).not.toBeNull();

      startScene.data.title = "This is a very long title that should get the long class";
      startScene.titleTextElement = titleElement;
      startScene.generateGameTitle();

      expect(titleElement.classList.contains('title-long')).toBeTruthy();
    });

    it('Should not add title-long class when title length is 20 or less', () => {
      const titleElement = document.getElementById("title");
      expect(titleElement).not.toBeNull();

      startScene.data.title = "Short Title";
      startScene.titleTextElement = titleElement;
      startScene.generateGameTitle();

      expect(titleElement.classList.contains('title-long')).toBeFalsy();
    });
  });

  describe('When Play Button is clicked ', () => {
    it('Callback for switching scene should be called.', () => {
      // Trigger the onClick callback directly by calling the mock callback
      if (mockOnClickCallback) {
        mockOnClickCallback(); // Simulate the button click
      }

      gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_SELECT);

      //Expect the Game State would receive a publish to switch scene.
      expect(gameStateService.publish).toHaveBeenCalledWith(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        expect.any(String)
      );
    });

    it('The game state publish should be called', () => {
      // Trigger the onClick callback directly by calling the mock callback
      if (mockOnClickCallback) {
        mockOnClickCallback(); // Simulate the button click
      }

      // Check if gameStateService.publish was called
      // Using toHaveBeenCalled for testing as plat button has multiple scenarions that calls multiple functions.
      expect(gameStateService.publish).toHaveBeenCalled();
    });

    it('The audio player playButtonClickSound should be called', () => {
      // Trigger the onClick callback directly by calling the mock callback
      if (mockOnClickCallback) {
        mockOnClickCallback(); // Simulate the button click
      }

      // audioPlayer.playButtonClickSound
      expect(startScene.audioPlayer.playButtonClickSound).toHaveBeenCalledTimes(1);
    });

    it('The onClick callback should be called', () => {
      if (mockOnClickCallback) {
        mockOnClickCallback();
      }

      // Check if the mock play button's onClick handler was called
      expect(mockPlayBtn.onClick).toHaveBeenCalledTimes(1);
    });

    it('The sendTappedStartEvent should be called', () => {
      // Trigger the onClick callback directly by calling the mock callback
      if (mockOnClickCallback) {
        mockOnClickCallback(); // Simulate the button click
      }

      // Check if sendTappedStartEvent was called
      expect(mockAnalytics.sendTappedStartEvent).toHaveBeenCalledTimes(1); // Assuming mockAnalytics is correctly set
    });

    it('Should remove the dev button.', () => {
      // Trigger the onClick callback directly by calling the mock callback
      if (mockOnClickCallback) {
        mockOnClickCallback(); // Simulate the button click
      }

      const devBtn = document.getElementById('toggle-btn');

      expect(devBtn.style.display).toEqual('none');
    })
  });

});