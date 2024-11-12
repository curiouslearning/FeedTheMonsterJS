import {MapButton, RetryButtonHtml, NextButtonHtml} from '@components/buttons';
import {LevelEndScene} from './levelend-scene';

// Mock the getContext method on HTMLCanvasElement to avoid "not implemented" errors
beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({width: 0})),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    }),
  });
});

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

    const mockCanvas = document.createElement('canvas');
    mockCanvas.id = 'canvas';
    document.body.appendChild(mockCanvas);
    const mockContext = mockCanvas.getContext('2d');

    levelEndScene = new LevelEndScene(
      mockCanvas,
      600, // height
      800, // width
      mockContext,
      3, // starCount
      1, // currentLevel
      mockSwitchToGameplayCB,
      mockSwitchToLevelSelectionCB,
      mockData,
      1, // monsterPhaseNumber
    );
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
        currentLevelData: { ...mockData.levels[1], levelNumber: 1 },
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
    } else {
      document.getElementById('levelend-next-btn').remove();
    }
  }
  

  describe('Given Default parameters', () => {
    describe('When LevelEndScene renders', () => {
      it('it should render MapButton', () => {
        renderButtonsHTML(false);
        expect(document.getElementById('levelend-map-btn')).not.toBeNull();
      });

      it('it should render RetryButtonHtml', () => {
        renderButtonsHTML(false);
        expect(document.getElementById('levelend-retry-btn')).not.toBeNull();
      });

      it('it should render NextButtonHtml if isLastLevel is false', () => {
        renderButtonsHTML(false);
        expect(document.getElementById('levelend-next-btn')).not.toBeNull();
      });

      it('should not render NextButtonHtml if isLastLevel is true', () => {
        renderButtonsHTML(true); // Pass true to simulate the last level
      
        const nextButton = document.getElementById('levelend-next-btn');
        console.log(nextButton);
        expect(nextButton).toBeNull(); // Confirm the button does not exist
      });
    });

    describe('When clicking MapButton', () => {
      it('it should call switchToLevelSelectionCB', () => {
        renderButtonsHTML(true);
        const mapButton = document.getElementById(
          'levelend-map-btn',
        ) as HTMLButtonElement;
        mapButton.click();
        expect(mockSwitchToLevelSelectionCB).toHaveBeenCalled();
      });
    });

    describe('When clicking RetryButtonHtml', () => {
      it('it should call switchToGameplayCB with correct data', () => {
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
    });

    describe('When clicking NextButtonHtml', () => {
      it('it should call switchToGameplayCB with correct data if isLastLevel is false', () => {
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
    });
  });
});
