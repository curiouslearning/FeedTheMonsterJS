import {MapButton, RetryButtonHtml, NextButtonHtml} from '@components/buttons';

describe('LevelEndScene Buttons', () => {
  let mockSwitchToGameplayCB: jest.Mock;
  let mockSwitchToLevelSelectionCB: jest.Mock;
  let mockData: any;

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

  describe('Button Rendering', () => {
    it('should render MapButton and RetryButtonHtml by default', () => {
      renderButtonsHTML(true);
      expect(document.getElementById('levelend-map-btn')).not.toBeNull();
      expect(document.getElementById('levelend-retry-btn')).not.toBeNull();
    });

    it('should render NextButtonHtml only if isLastLevel is false', () => {
      renderButtonsHTML(false);
      expect(document.getElementById('levelend-next-btn')).not.toBeNull();
    });

    it('should not render NextButtonHtml if isLastLevel is true', () => {
      renderButtonsHTML(true);
      expect(document.getElementById('levelend-next-btn')).toBeNull();
    });
  });

  describe('Button Click Callbacks', () => {
    it('should call switchToLevelSelectionCB when MapButton is clicked', () => {
      renderButtonsHTML(true);
      const mapButton = document.getElementById(
        'levelend-map-btn',
      ) as HTMLButtonElement;
      mapButton.click();
      expect(mockSwitchToLevelSelectionCB).toHaveBeenCalled();
    });

    it('should call switchToGameplayCB with correct data when RetryButtonHtml is clicked', () => {
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

    it('should call switchToGameplayCB with correct data when NextButtonHtml is clicked if isLastLevel is false', () => {
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
