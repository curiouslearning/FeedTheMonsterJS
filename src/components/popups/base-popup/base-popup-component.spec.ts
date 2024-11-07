import { BasePopupComponent } from './base-popup-component';

describe('BasePopupComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-scene');
    document.body.appendChild(roolEl);
  });

  describe('Given default settings', () => {
    let popup: BasePopupComponent;
    let popupEl;
    beforeEach(() => {
      popup = new BasePopupComponent();
      popup.render();
      popupEl = document.querySelector('#base-popup');
    });

    afterEach(() => {
      if (popup) popup.destroy();
    });

    describe('When initialized', () => {
      it('it should append #base-popup to .game-scene', () => {
        expect(document.querySelector('#base-popup')).toBeTruthy();
      });

      it('it should call init', () => {
        const initSpy = jest.spyOn(BasePopupComponent.prototype, 'onInit');
        new BasePopupComponent();

        setTimeout(() => {
          expect(initSpy).toHaveBeenCalled();
        }, 500);
      });
    });

    describe('When open is called', () => {
      it('it should add "show" css class to popup', () => {
        popup.open();
        expect(popupEl.classList.contains('show')).toBeTruthy();
      });
    });

    describe('When open and then close is called', () => {
      it('it should remove "show" css class from the popup', () => {
        popup.open();
        popup.close();
        expect(popupEl.classList.contains('show')).toBeFalsy();
      });
    });

    describe('When close button is clicked', () => {
      it('it should remove "show" css class from the popup', () => {
        const closeBtn = popup.closeButton;
        const clickEvent = new Event('click', {
          bubbles: true
        })
        popup.open();
        closeBtn.getElement().dispatchEvent(clickEvent);

        setTimeout(() => {
          // ensure click timeout is finished
          expect(popupEl.classList.contains('show')).toBeFalsy();
        }, 500);
      });

      it('it should call hide method', () => {
        const hideSpy = jest.spyOn(BasePopupComponent.prototype, 'close');
        const closeBtn = popup.closeButton;
        const clickEvent = new Event('click', {
          bubbles: true
        })
        popup.open();
        closeBtn.getElement().dispatchEvent(clickEvent);

        setTimeout(() => {
          // ensure click timeout is finished
          expect(hideSpy).toHaveBeenCalled();
        }, 500);
      });

      it('it should call onClose callback', () => {
        const fakeCb = jest.fn();
        popup.onClose(fakeCb);
        const closeBtn = popup.closeButton;
        const clickEvent = new Event('click', {
          bubbles: true
        })
        popup.open();
        closeBtn.getElement().dispatchEvent(clickEvent);

        setTimeout(() => {
          // ensure click timeout is finished
          expect(fakeCb).toHaveBeenCalled();
        }, 500);
      });
    });
    
    describe('When destroy is called', () => {
      it('it should remove the popup element', () => {
        popup.open();
        popup.destroy();

        const popupEl = document.querySelector('#base-popup');
        expect(popupEl).toBeFalsy();
      });
    });
  });
});
