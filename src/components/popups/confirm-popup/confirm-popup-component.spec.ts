import {ConfirmPopupComponent} from './confirm-popup-component';

jest.useFakeTimers();

describe('ConfirmPopupComponent', () => {
  let popup: ConfirmPopupComponent;
  let popupEl: Element;

  beforeEach(() => {
    document.body.innerHTML = '';
    const rootEl = document.createElement('div');
    rootEl.classList.add('game-scene');
    document.body.appendChild(rootEl);

    popup = new ConfirmPopupComponent();
    jest.runAllTimers();
    popup.render();
    popupEl = document.querySelector('#confirm-popup');

    // Mock confirmButton
    const mockConfirmButtonElement = document.createElement('button');
    const mockConfirmSetDisabled = jest.fn();

    popup.confirmButton = {
      setDisabled: mockConfirmSetDisabled,
      getElement: jest.fn(() => mockConfirmButtonElement),
      onClick: jest.fn((callback: (data: boolean) => void) =>
        mockConfirmButtonElement.addEventListener('click', () =>
          callback(true),
        ),
      ),
    } as any;

    // Mock cancelButton
    const mockCancelButtonElement = document.createElement('button');
    const mockCancelSetDisabled = jest.fn();

    popup.cancelButton = {
      setDisabled: mockCancelSetDisabled,
      getElement: jest.fn(() => mockCancelButtonElement),
      onClick: jest.fn((callback: (data: boolean) => void) =>
        mockCancelButtonElement.addEventListener('click', () =>
          callback(false),
        ),
      ),
    } as any;

    // Attach the event listeners
    popup.confirmButton.onClick(() => popup.handleClick(true));
    popup.cancelButton.onClick(() => popup.handleClick(false));
  });

  afterEach(() => {
    popup.destroy();
    jest.clearAllTimers();
  });

  describe('Given default options', () => {
    it('should create the confirmation popup element', () => {
      expect(popupEl).toBeTruthy();
    });
  });

  describe('When confirmButton is clicked', () => {
    it('should handle confirm click', () => {
      const handleClickSpy = jest.spyOn(popup, 'handleClick');
      const buttonElement = popup.confirmButton?.getElement();

      // Simulate the click
      buttonElement?.dispatchEvent(new Event('click'));

      // Verify that handleClick is called with true
      expect(handleClickSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('When cancelButton is clicked', () => {
    it('should handle cancel click', () => {
      const handleClickSpy = jest.spyOn(popup, 'handleClick');
      const buttonElement = popup.cancelButton?.getElement();

      // Simulate the click
      buttonElement?.dispatchEvent(new Event('click'));

      // Verify that handleClick is called with false
      expect(handleClickSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('When disableButtons is called', () => {
    it('should disable both buttons', () => {
      popup.disableButtons();

      // Verify that setDisabled(true) was called on both buttons
      expect(popup.confirmButton?.setDisabled).toHaveBeenCalledWith(true);
      expect(popup.cancelButton?.setDisabled).toHaveBeenCalledWith(true);
    });
  });

  describe('When enableButtons is called', () => {
    it('should enable both buttons', () => {
      popup.enableButtons();

      // Verify that setDisabled(false) was called on both buttons
      expect(popup.confirmButton?.setDisabled).toHaveBeenCalledWith(false);
      expect(popup.cancelButton?.setDisabled).toHaveBeenCalledWith(false);
    });
  });

  describe('When scheduleEnableButtons is called', () => {
    it('should enable buttons after the specified delay', () => {
      popup.scheduleEnableButtons(800);

      expect(popup.confirmButton?.setDisabled).not.toHaveBeenCalled();
      expect(popup.cancelButton?.setDisabled).not.toHaveBeenCalled();

      jest.advanceTimersByTime(800);

      expect(popup.confirmButton?.setDisabled).toHaveBeenCalledWith(false);
      expect(popup.cancelButton?.setDisabled).toHaveBeenCalledWith(false);
    });

    it('should clear the previous timeout if called again', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      popup.scheduleEnableButtons(800);
      popup.scheduleEnableButtons(1000);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      jest.advanceTimersByTime(1000);

      expect(popup.confirmButton?.setDisabled).toHaveBeenCalledWith(false);
      expect(popup.cancelButton?.setDisabled).toHaveBeenCalledWith(false);
    });
  });

  describe('When destroy is called', () => {
    it('should clear the timeout for enabling buttons', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      popup.scheduleEnableButtons(800);

      popup.destroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should call the destroy method of the parent component', () => {
      const parentDestroySpy = jest.spyOn(
        ConfirmPopupComponent.prototype,
        'destroy',
      );
      popup.destroy();

      expect(parentDestroySpy).toHaveBeenCalled();
    });
  });
});
