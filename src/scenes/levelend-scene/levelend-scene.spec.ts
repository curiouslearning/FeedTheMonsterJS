import {LevelEndScene} from './levelend-scene';
import gameStateService from '@gameStateService';

describe('LevelEndScreen', () => {
  let mockSwitchToGameplayCB: jest.Mock;
  let mockSwitchToLevelSelectionCB: jest.Mock;
  let mockData: any;
  let levelEndScene: LevelEndScene;

  beforeEach(() => {
    document.body.innerHTML = '';
    mockSwitchToGameplayCB = jest.fn();
    mockSwitchToLevelSelectionCB = jest.fn();
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

    // Mock data example
    gameStateService.publish(gameStateService.EVENTS.LEVEL_END_DATA_EVENT, {
      levelEndData: {
        starCount: 3,
        currentLevel: 0,
        isTimerEnded: false,
      },
      data: mockData,
    });

    levelEndScene = new LevelEndScene(
      mockSwitchToGameplayCB,
      mockSwitchToLevelSelectionCB,
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('When instantiated', () => {
    it('should call showLevelEndScreen', () => {
      const initSpy = jest.spyOn(LevelEndScene.prototype, 'showLevelEndScreen');

      // Re-instantiate to trigger the constructor after spying on the method
      levelEndScene = new LevelEndScene(
        mockSwitchToGameplayCB,
        mockSwitchToLevelSelectionCB,
      );

      expect(initSpy).toHaveBeenCalled();
    });
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
});
