import { BasePopupComponent } from './base-popup-component';

describe('BasePopupComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const roolEl = document.createElement('div');
    roolEl.classList.add('game-scene');
    document.body.appendChild(roolEl);
  });

  describe('Given default settings', () => {
    describe('When initialized', () => {
      it('it should append #base-popup to .game-scene', () => {
        new BasePopupComponent();

        expect(document.querySelector('#base-popup')).toBeTruthy();
      });

      it('it should call init', () => {
        const initSpy = jest.spyOn(BasePopupComponent.prototype, 'init');
        new BasePopupComponent();

        expect(initSpy).toHaveBeenCalled();
      });
    });

    describe('When show is called', () => {
      it('it should add "show" css class to popup', () => {
        const popup = new BasePopupComponent();
        const popupEl = document.querySelector('#base-popup');
        popup.show();
        expect(popupEl.classList.contains('show')).toBeTruthy();
      });
    });

    describe('When show and then hide is called', () => {
      it('it should remove "show" css class from the popup', () => {
        const popup = new BasePopupComponent();
        const popupEl = document.querySelector('#base-popup');
        popup.show();
        popup.hide();
        expect(popupEl.classList.contains('show')).toBeFalsy();
      });
    });

    describe('When close button is clicked', () => {
      it('it should remove "show" css class from the popup', () => {
        const popup = new BasePopupComponent();
        const popupEl = document.querySelector('#base-popup');
        const closeBtn = popupEl.querySelector('[data-click="close"]');
        const clickEvent = new Event('click', {
          bubbles: true
        })
        popup.show();
        closeBtn.dispatchEvent(clickEvent);

        setTimeout(() => {
          // ensure click timeout is finished
          expect(popupEl.classList.contains('show')).toBeFalsy();
        }, 500);
      });

      it('it should call hide method', () => {
        const hideSpy = jest.spyOn(BasePopupComponent.prototype, 'hide');
        const popup = new BasePopupComponent();
        const popupEl = document.querySelector('#base-popup');
        const closeBtn = popupEl.querySelector('[data-click="close"]');
        const clickEvent = new Event('click', {
          bubbles: true
        })
        popup.show();
        closeBtn.dispatchEvent(clickEvent);

        setTimeout(() => {
          // ensure click timeout is finished
          expect(hideSpy).toHaveBeenCalled();
        }, 500);
      });

      it('it should call onClose method', () => {
        const onCloseSpy = jest.spyOn(BasePopupComponent.prototype, 'onClose');
        const popup = new BasePopupComponent();
        const popupEl = document.querySelector('#base-popup');
        const closeBtn = popupEl.querySelector('[data-click="close"]');
        const clickEvent = new Event('click', {
          bubbles: true
        })
        popup.show();
        closeBtn.dispatchEvent(clickEvent);

        setTimeout(() => {
          // ensure click timeout is finished
          expect(onCloseSpy).toHaveBeenCalled();
        }, 500);
      });
    });
    
    describe('When desctroy is called', () => {
      it('it should remove the popup element', () => {
        const popup = new BasePopupComponent();
        popup.destroy();

        const popupEl = document.querySelector('#base-popup');
        expect(popupEl).toBeFalsy();
      });
    });
  });
});
