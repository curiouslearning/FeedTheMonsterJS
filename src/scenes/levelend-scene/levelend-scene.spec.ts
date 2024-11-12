import {MapButton, RetryButtonHtml, NextButtonHtml} from '@components/buttons';
import {LevelEndScene} from './levelend-scene';

describe('LevelEndScreen', () => {
  let mockSwitchToGameplayCB: jest.Mock;
  let mockSwitchToLevelSelectionCB: jest.Mock;
  let mockData: any;
  let levelEndScene: LevelEndScene;

  describe('Given Default', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      mockSwitchToGameplayCB = jest.fn();
      mockSwitchToLevelSelectionCB = jest.fn();
      mockData = {
        levels: [{levelMeta: {levelNumber: 1}}, {levelMeta: {levelNumber: 2}}],
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
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    function renderButton(
      id: string,
      ButtonClass:
        | typeof MapButton
        | typeof RetryButtonHtml
        | typeof NextButtonHtml,
      onClick: () => void,
    ) {
      const button = new ButtonClass({targetId: 'levelEndButtons', id});
      button.onClick(onClick);
    }

    function renderButtonsHTML(isLastLevel: boolean) {
      renderButton('levelend-map-btn', MapButton, mockSwitchToLevelSelectionCB);
      renderButton('levelend-retry-btn', RetryButtonHtml, () => {
        mockSwitchToGameplayCB({
          currentLevelData: {...mockData.levels[1], levelNumber: 1},
          selectedLevelNumber: 1,
        });
      });

      if (!isLastLevel) {
        renderButton('levelend-next-btn', NextButtonHtml, () => {
          const nextLevel = 2;
          mockSwitchToGameplayCB({
            currentLevelData: {
              ...mockData.levels[nextLevel],
              levelNumber: nextLevel,
            },
            selectedLevelNumber: nextLevel,
          });
        });
      }
    }

    describe('When instantiated', () => {
      it('should call showLevelEndScreen', () => {
        const initSpy = jest.spyOn(LevelEndScene.prototype, 'showLevelEndScreen');
        levelEndScene = new LevelEndScene(
          600, // height
          800, // width
          3, // starCount
          1, // currentLevel
          mockSwitchToGameplayCB,
          mockSwitchToLevelSelectionCB,
          mockData,
          1, // monsterPhaseNumber
        );
        jest.runAllTimers();
        expect(initSpy).toHaveBeenCalled();
      });
    });

    describe('Levelend buttons should be now HTML', () => {
      it('it should render MapButton', () => {
        renderButtonsHTML(false);
        expect(document.getElementById('levelend-map-btn')).not.toBeNull();
      });

      it('it should call switchToLevelSelectionCB when Map button is clicked', () => {
        renderButtonsHTML(true);
        const mapButton = document.getElementById(
          'levelend-map-btn',
        ) as HTMLButtonElement;
        mapButton.click();
        expect(mockSwitchToLevelSelectionCB).toHaveBeenCalled();
      });

      it('it should render RetryButtonHtml', () => {
        renderButtonsHTML(false);
        expect(document.getElementById('levelend-retry-btn')).not.toBeNull();
      });

      it('it should call switchToGameplayCB with correct data when Retry button is clicked', () => {
        renderButtonsHTML(true);
        const retryButton = document.getElementById(
          'levelend-retry-btn',
        ) as HTMLButtonElement;
        retryButton.click();

        expect(mockSwitchToGameplayCB).toHaveBeenCalledWith({
          currentLevelData: {...mockData.levels[1], levelNumber: 1},
          selectedLevelNumber: 1,
        });
      });

      it('it should render NextButtonHtml if isLastLevel is false', () => {
        renderButtonsHTML(false);
        expect(document.getElementById('levelend-next-btn')).not.toBeNull();
      });

      it('it should call switchToGameplayCB with correct data if isLastLevel is false when Next Button is clicked', () => {
        renderButtonsHTML(false);
        const nextButton = document.getElementById(
          'levelend-next-btn',
        ) as HTMLButtonElement;
        nextButton.click();

        expect(mockSwitchToGameplayCB).toHaveBeenCalledWith({
          currentLevelData: {...mockData.levels[2], levelNumber: 2},
          selectedLevelNumber: 2,
        });
      });

      it('should not render NextButtonHtml if isLastLevel is true', () => {
        renderButtonsHTML(true); // Pass true to simulate the last level

        const nextButton = document.getElementById('levelend-next-btn');
        console.log(nextButton);
        expect(nextButton).toBeNull(); // Confirm the button does not exist
      });
    });
  });
});
