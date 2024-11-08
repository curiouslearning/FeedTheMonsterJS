import { PausePopupComponent } from './pause-popup-component';
jest.useFakeTimers();

describe('PausePopupComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-scene');
    document.body.appendChild(roolEl);
  });

  describe('Given Default', () => {
    let popup: PausePopupComponent;
    let popupEl: Element;

    beforeEach(() => {
      popup = new PausePopupComponent();
      jest.runAllTimers();
      popup.render();
      popupEl = document.querySelector('#pause-popup');
    });

    afterEach(() => {
      if (popup) popup.destroy();
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
      it('should set selectLevelButton', async () => {
        expect(popup.selectLevelButton).toBeTruthy();
      });

      it('should set retartLevelButton', () => {
        expect(popup.restartLevelButton).toBeTruthy();
      });
    });

    describe('When popup.selectLevelButton is clicked', () => {
      it('should close the popup', () => {
        popup.open();
        popup.selectLevelButton.getElement().dispatchEvent(new Event('click'));
        jest.runAllTimers();
        expect(popupEl.classList.contains('show')).toBeFalsy();
      });
    });
  
    describe('When popup.restartLevelButton is clicked', () => {
      it('should close the popup', () => {
        popup.open();
        popup.selectLevelButton.getElement().dispatchEvent(new Event('click'));
        jest.runAllTimers();
        expect(popupEl.classList.contains('show')).toBeFalsy();
      });
    });

    describe('When popup is opened', () => {
      it('should render pause popup element', () => {
        expect(popupEl).toBeTruthy();
      });
    });
  });
});
