import { StartScene } from './start-scene';
import { PlayButtonHtml } from '@components/buttons';
import { FirebaseIntegration } from "../../Firebase/firebase-integration";
import { FeedbackAudios, FeedbackTexts } from '@data/data-modal';


jest.mock("../../Firebase/firebase-integration", () => ({
  FirebaseIntegration: jest.fn().mockImplementation(() => ({
    sendTappedStartEvent: jest.fn()
  })),
}));


describe('Start Scene Test', () => {
  let startScene;
  let mockPlayBtn;
  let mockOnClickCallback;
  let mockFirebase;

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

    // Mock canvas
    const mockCanvas = document.getElementById('canvas') as HTMLCanvasElement;
    mockCanvas.getContext = jest.fn().mockReturnValue({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
    });

    // Create the startScene instance
    startScene = new StartScene(
      mockCanvas,
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

    // Ensure startScene uses the mockFirebase
    startScene.firebaseIntegration = mockFirebase;

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

  it('When Play Button is clicked, the onClick callback should be called', () => {
    if (mockOnClickCallback) {
      mockOnClickCallback();
    }

    // Check if the mock play button's onClick handler was called
    expect(mockPlayBtn.onClick).toHaveBeenCalledTimes(1);
  });

  it('When Play Button is clicked, sendTappedStartEvent should be called', () => {
    // Trigger the onClick callback directly by calling the mock callback
    if (mockOnClickCallback) {
      mockOnClickCallback(); // Simulate the button click
    }

    // Check if sendTappedStartEvent was called
    expect(mockFirebase.sendTappedStartEvent).toHaveBeenCalledTimes(1); // Assuming mockFirebase is correctly set
  });
});
