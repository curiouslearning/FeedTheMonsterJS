import {PausePopupComponent} from './pause-popup-component';

jest.useFakeTimers();

describe('PausePopupComponent', () => {
  let popup: PausePopupComponent;
  let popupEl: Element;

  beforeEach(() => {
    document.body.innerHTML = '';
    const rootEl = document.createElement('div');
    rootEl.classList.add('game-scene');
    document.body.appendChild(rootEl);

    popup = new PausePopupComponent();
    jest.runAllTimers();
    popup.render();
    popupEl = document.querySelector('#pause-popup');

    // Mock setDisabled and getElement for buttons
    const mockButtonElement = document.createElement('button');
    popup.selectLevelButton = {
      ...popup.selectLevelButton,
      setDisabled: jest.fn(),
      getElement: jest.fn(() => mockButtonElement),
    } as any;

    popup.restartLevelButton = {
      ...popup.restartLevelButton,
      setDisabled: jest.fn(),
      getElement: jest.fn(() => mockButtonElement),
    } as any;
  });

  afterEach(() => {
    popup.destroy();
    jest.clearAllTimers();
  });

  describe('When instantiated', () => {
    it('should call onInit', () => {
      const initSpy = jest.spyOn(PausePopupComponent.prototype, 'onInit');
      new PausePopupComponent();
      jest.runAllTimers();
      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('When onInit is called', () => {
    it('should set selectLevelButton', () => {
      expect(popup.selectLevelButton).toBeTruthy();
    });

    it('should set restartLevelButton', () => {
      expect(popup.restartLevelButton).toBeTruthy();
    });
  });

  describe('When popup.selectLevelButton is clicked', () => {
    it('should show the confirm popup', () => {
      popup.open();
      const buttonElement = popup.selectLevelButton?.getElement();
      buttonElement?.dispatchEvent(new Event('click'));
      jest.runAllTimers();
      const confirmPopup = document.querySelector('#confirm-popup');
      expect(confirmPopup).toBeTruthy();
    });
  });

  describe('When popup.restartLevelButton is clicked', () => {
    it('should show the confirm popup', () => {
      popup.open();
      const buttonElement = popup.restartLevelButton?.getElement();
      buttonElement?.dispatchEvent(new Event('click'));
      jest.runAllTimers();
      const confirmPopup = document.querySelector('#confirm-popup');
      expect(confirmPopup).toBeTruthy();
    });
  });

  describe('When popup is opened', () => {
    it('should render pause popup element', () => {
      expect(popupEl).toBeTruthy();
    });
  });

  describe('When disableButtons is called', () => {
    it('should disable selectLevelButton', () => {
      popup.disableButtons();
      expect(popup.selectLevelButton?.setDisabled).toHaveBeenCalledWith(true);
    });

    it('should disable restartLevelButton', () => {
      popup.disableButtons();
      expect(popup.restartLevelButton?.setDisabled).toHaveBeenCalledWith(true);
    });
  });

  describe('When enableButtons is called', () => {
    it('should enable selectLevelButton', () => {
      popup.enableButtons();
      expect(popup.selectLevelButton?.setDisabled).toHaveBeenCalledWith(false);
    });

    it('should enable restartLevelButton', () => {
      popup.enableButtons();
      expect(popup.restartLevelButton?.setDisabled).toHaveBeenCalledWith(false);
    });
  });

  describe('When scheduleEnableButtons is called', () => {
    it('should enable buttons after the specified delay', () => {
      popup.scheduleEnableButtons(800); // Call the method with an 800ms delay

      // Buttons should still be disabled before the timeout
      expect(popup.selectLevelButton?.setDisabled).not.toHaveBeenCalled();
      expect(popup.restartLevelButton?.setDisabled).not.toHaveBeenCalled();

      // Fast-forward the timers
      jest.advanceTimersByTime(800);

      // Buttons should now be enabled
      expect(popup.selectLevelButton?.setDisabled).toHaveBeenCalledWith(false);
      expect(popup.restartLevelButton?.setDisabled).toHaveBeenCalledWith(false);
    });

    it('should clear the previous timeout if called again', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      popup.scheduleEnableButtons(800); // Call the method with an 800ms delay
      popup.scheduleEnableButtons(1000); // Call the method again with a new delay

      // Ensure the previous timeout was cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();
      jest.advanceTimersByTime(1000);

      // Buttons should be enabled after the new timeout
      expect(popup.selectLevelButton?.setDisabled).toHaveBeenCalledWith(false);
      expect(popup.restartLevelButton?.setDisabled).toHaveBeenCalledWith(false);
    });
  });
});
