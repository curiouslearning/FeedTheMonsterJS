import { PausePopupComponent } from './pause-popup-component';

describe('PausePopupComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-scene');
    document.body.appendChild(roolEl);
  });

  describe('Given Default', () => {
    let popup;
    let popupEl;

    beforeEach(() => {
      popup = new PausePopupComponent();
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

        setTimeout(() => {
          expect(initSpy).toHaveBeenCalled();
        }, 100);
      });

      it('should call onButtonClick', () => {
        const onButtonClickSpy = jest.spyOn(PausePopupComponent.prototype, 'onButtonClick');
        new PausePopupComponent();

        setTimeout(() => {
          expect(onButtonClickSpy).toHaveBeenCalled();
        }, 100);
      });
    });

    describe('When onInit is called', () => {
      it('should call onButtonClick', () => {
        const onButtonClickSpy = jest.spyOn(PausePopupComponent.prototype, 'onButtonClick');
        const popup = new PausePopupComponent();
        popup.onInit();

        expect(onButtonClickSpy).toHaveBeenCalled();
      });

      it('should set selectLevelButton', () => {
        setTimeout(() => {
          expect(popup.selectLevelButton ).toBeTruthy();
        }, 100);
      });

      it('should set retartLevelButton', () => {
        setTimeout(() => {
          expect(popup.retartLevelButton).toBeTruthy();
        }, 100);
      });
    });
  
    describe('When popup is opened', () => {
      it('should render pause popup element', () => {
        expect(popupEl).toBeTruthy();
      });
    });
  });
});
