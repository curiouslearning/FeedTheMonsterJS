import {LevelEndScene} from './levelend-scene';

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

    levelEndScene = new LevelEndScene(
      mockSwitchToGameplayCB,
      mockSwitchToLevelSelectionCB,
      mockData,
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
        mockData,
      );

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('Levelend buttons rendering', () => {
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

      expect(mockSwitchToGameplayCB).toHaveBeenCalledWith({
        currentLevelData: {
          levelMeta: {
            promptFadeOut: 0,
            letterGroup: 18,
            levelNumber: 1,
            protoType: 'Visible',
            levelType: 'LetterInWord',
          },
          puzzles: [],
          levelNumber: 1,
        },
        selectedLevelNumber: 1,
      });
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

      expect(mockSwitchToGameplayCB).toHaveBeenCalledWith({
        currentLevelData: {
          levelMeta: {
            promptFadeOut: 0,
            letterGroup: 19,
            levelNumber: 2,
            protoType: 'Visible',
            levelType: 'LetterInWord',
          },
          puzzles: [],
          levelNumber: 2,
        },
        selectedLevelNumber: 2,
      });
    });

    it('should not render NextButtonHtml if isLastLevel is true', () => {
      levelEndScene.isLastLevel = true; // Simulate last level scenario
      levelEndScene.renderButtonsHTML();

      const nextButton = document.getElementById('levelend-next-btn');
      expect(nextButton).toBeNull(); // Confirm the button does not exist
    });
  });
});
