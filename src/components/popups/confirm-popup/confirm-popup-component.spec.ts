import { ConfirmPopupComponent } from './confirm-popup-component';
jest.useFakeTimers();

describe('ConfirmPopupComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-scene');
    document.body.appendChild(roolEl);
  });

  describe('Given default options', () => {
    let popup: ConfirmPopupComponent;
    let popupEl: Element;

    beforeEach(() => {
      popup = new ConfirmPopupComponent();
      jest.runAllTimers();
      popup.render();
      popupEl = document.querySelector('#confirm-popup');
    });

    afterEach(() => {
      if (popup) popup.destroy();
    });

    describe('When initialized', () => {
      it('Should create the confirmation popup element', () => {
        expect(popupEl).toBeTruthy();
      });
    });
  });
});