import { StartScene } from './start-scene';
import { PlayButtonHtml } from '@components/buttons';
import { FirebaseIntegration } from "../../Firebase/firebase-integration";
import { FeedbackAudios, FeedbackTexts } from '@data/data-modal';
import { AudioPlayer } from "../../components/audio-player";
import gameStateService from '@gameStateService';

jest.mock("../../Firebase/firebase-integration", () => ({
  FirebaseIntegration: jest.fn().mockImplementation(() => ({
    sendTappedStartEvent: jest.fn()
  })),
}));
jest.mock("../../components/audio-player", () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playButtonClickSound: jest.fn()
  })),
}));
jest.mock('@gameStateService', () => ({
  EVENTS: {
    SCENE_LOADING_EVENT: 'SCENE_LOADING_EVENT'
  },
  publish: jest.fn()
}));


describe('Start Scene Test', () => {
  let startScene;
  let mockPlayBtn;
  let mockOnClickCallback;
  let mockFirebase;
  let mockAudioPlayer;
  const switchSceneMockFunc = jest.fn();

  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <div id="title" class="title" style="font-family: Atma-SemiBold, sans-serif;">Feed the Monster</div>
        <button id="toggle-btn" class="off">Dev</button>
        <div class="game-scene"></div>
        <div id="canvas"></div>
        <canvas id="rivecanvas"></canvas>
        <canvas id="game-control"></canvas>
        <div id="popup-root"></div>
        <div id="version-info-id">1.0.0</div>
      </div>
    `;

    // Setup mock text and audio
    const feedTextMock = {
      FeedbackTexts: {
        "fantastic": "Fantastic!",
        "great": "Great!",
        "amazing": "Amazing!"
      }
    };

    const feedAudioMock = {
      FeedbackAudios: {
        "fantastic": "",
        "great": "",
        "amazing": ""
      }
    };

    // Mock the Firebase instance (this is what is used in your StartScene class)
    mockFirebase = new FirebaseIntegration();

    //Mock Audio Player instance
    mockAudioPlayer = new AudioPlayer();

    // Create the startScene instance
    startScene = new StartScene(
      {
        title: '',
        otherAudios: {
          areYouSure: '',
          watchMeGrow: '',
          selctYourPlayer: 'test'
        },
        majVersion: 3,
        minVersion: 15,
        version: 1,
        levels: 145,
        rightToLeft: false,
        FeedbackTexts: new FeedbackTexts(feedTextMock),
        FeedbackAudios: new FeedbackAudios(feedAudioMock),
        getLevels: () => {}
      },
      () => {}
    );

    // Ensure startScene uses the mock data
    startScene.firebaseIntegration = mockFirebase;
    startScene.audioPlayer = mockAudioPlayer;
    startScene.switchSceneToLevelSelection = switchSceneMockFunc;

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

  describe('When Play Button is clicked ', () => {
    it('Callback for switching scene should be called.', () => {
      // Trigger the onClick callback directly by calling the mock callback
      if (mockOnClickCallback) {
        mockOnClickCallback(); // Simulate the button click
      }

      // Check if switchSceneToLevelSelection was called
      // Using toHaveBeenCalled for testing as plat button has multiple scenarions that calls multiple functions.
      expect(startScene.switchSceneToLevelSelection).toHaveBeenCalled();
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
      expect(mockFirebase.sendTappedStartEvent).toHaveBeenCalledTimes(1); // Assuming mockFirebase is correctly set
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
