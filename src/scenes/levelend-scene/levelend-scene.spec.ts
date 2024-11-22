import {LevelEndScene} from './levelend-scene';
import gameStateService from '@gameStateService';
import {AudioPlayer} from '@components';

// Mocking the AudioPlayer class
jest.mock('@components', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    stopAllAudios: jest.fn(), // Mock stopAllAudios
    playAudio: jest.fn(),
    playButtonClickSound: jest.fn(),
    stopFeedbackAudio: jest.fn(),
  })),
}));

describe('LevelEndScreen', () => {
  let mockSwitchToGameplayCB: jest.Mock;
  let mockSwitchToLevelSelectionCB: jest.Mock;
  let mockData: any;
  let levelEndScene: LevelEndScene;
  let audioPlayerMock: jest.Mocked<AudioPlayer>;

  beforeEach(() => {
    // Reset the DOM
    document.body.innerHTML = '';
  
    // Mock callback functions
    mockSwitchToGameplayCB = jest.fn();
    mockSwitchToLevelSelectionCB = jest.fn();
  
    // Mock level data
    mockData = {
      levels: [
        {
          levelMeta: {
            promptFadeOut: 0,
            letterGroup: 18,
            levelNumber: 1,
            protoType: 'Visible',
            levelType: 'LetterInWord',
          },
          puzzles: [],
        },
        {
          levelMeta: {
            promptFadeOut: 0,
            letterGroup: 19,
            levelNumber: 2,
            protoType: 'Visible',
            levelType: 'LetterInWord',
          },
          puzzles: [],
        },
      ],
    };
  
    // Mock the DOM elements
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'levelEndButtons';
    document.body.appendChild(buttonsContainer);
  
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    document.body.appendChild(starsContainer);
  
    const levelEndElement = document.createElement('div');
    levelEndElement.id = 'levelEnd';
    document.body.appendChild(levelEndElement);
  
    const gameControlElement = document.createElement('div');
    gameControlElement.id = 'game-control';
    document.body.appendChild(gameControlElement);
  
    // Add the mocked canvas element
    const canvasElement = document.createElement('canvas');
    canvasElement.id = 'rivecanvas';
    document.body.appendChild(canvasElement);
  
    // Mock game state service
    gameStateService.publish(gameStateService.EVENTS.LEVEL_END_DATA_EVENT, {
      levelEndData: {
        starCount: 3,
        currentLevel: 0,
        isTimerEnded: false,
      },
      data: mockData,
    });
  
    // Mock the AudioPlayer instance
    audioPlayerMock = new AudioPlayer() as jest.Mocked<AudioPlayer>;
  
    // Initialize the LevelEndScene
    levelEndScene = new LevelEndScene(
      mockSwitchToGameplayCB,
      mockSwitchToLevelSelectionCB,
    );
  
    // Replace the audioPlayer instance in LevelEndScene with the mocked one
    levelEndScene.audioPlayer = audioPlayerMock;
  });  

  afterEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
  });

  describe('LevelEnd buttons rendering', () => {
    it('should render MapButton', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-map-btn')).not.toBeNull();
    });

    it('should call switchToLevelSelectionCB when Map button is clicked', () => {
      levelEndScene.renderButtonsHTML();
      const mapButton = document.getElementById(
        'levelend-map-btn',
      ) as HTMLButtonElement;
      mapButton.click();
      expect(mockSwitchToLevelSelectionCB).toHaveBeenCalled();
    });

    it('should render RetryButtonHtml', () => {
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-retry-btn')).not.toBeNull();
    });

    it('should call switchToGameplayCB with correct data when Retry button is clicked', () => {
      levelEndScene.renderButtonsHTML();
      const retryButton = document.getElementById(
        'levelend-retry-btn',
      ) as HTMLButtonElement;
      retryButton.click();
      expect(mockSwitchToGameplayCB).toHaveBeenCalledWith();
    });

    it('should render NextButtonHtml if isLastLevel is false', () => {
      levelEndScene.isLastLevel = false; // Explicitly set to false
      levelEndScene.renderButtonsHTML();
      expect(document.getElementById('levelend-next-btn')).not.toBeNull();
    });

    it('should call switchToGameplayCB with correct data when Next button is clicked', () => {
      levelEndScene.isLastLevel = false; // Ensure it’s not the last level
      levelEndScene.renderButtonsHTML();
      const nextButton = document.getElementById(
        'levelend-next-btn',
      ) as HTMLButtonElement;
      nextButton.click();
      expect(mockSwitchToGameplayCB).toHaveBeenCalledWith();
    });

    it('should not render NextButtonHtml if isLastLevel is true', () => {
      levelEndScene.isLastLevel = true; // Simulate last level scenario
      levelEndScene.renderButtonsHTML();
      const nextButton = document.getElementById('levelend-next-btn');
      expect(nextButton).toBeNull(); // Confirm the button does not exist
    });
  });

  describe('Dispose functionality', () => {
    it('should not dispose NextButtonHtml if not created', () => {
      levelEndScene.isLastLevel = true; // Simulate last level scenario
      levelEndScene.renderButtonsHTML();
      levelEndScene.dispose();
      expect(levelEndScene.nextButtonInstance).toBeNull(); // Updated to check for null
    });

    it('should dispose of all button instances on dispose', () => {
      levelEndScene.isLastLevel = false; // Explicitly set to false
      levelEndScene.renderButtonsHTML();
      levelEndScene.dispose();

      expect(levelEndScene.mapButtonInstance).toBeNull();
      expect(levelEndScene.retryButtonInstance).toBeNull();
      expect(levelEndScene.nextButtonInstance).toBeNull();
    });
  });
});
