import { POPUP_BG_IMG } from '@constants';
import { PubSub } from '../../../events/pub-sub-events';
import { CancelButtonHtml } from '@components/buttons';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import './base-popup-component.scss';

const DEFAULT_SELECTORS = {
  root: '.game-scene',
  closeButton: '[data-click="close"]'
};

const FIXED_SELECTORS = {
  autoClickBind: '[data-click]'
};

const CSS_SHOW = 'show';

export const POPUP_LAYOUT = (id: string, content: string, showClose: boolean = true): string => `
  <div id="${id}" class="popup">
    <div class="popup__overlay"></div>
    <div id="${id}-content-wrapper" class="popup__content-wrapper" >
      <img id="popup-bg" src="${POPUP_BG_IMG}" />
      <div id="${id}-content-container" class="popup__content-container">${content}</div>
    </div>
  </div>
`;

export interface PopupOptions {
  hideClose?: boolean;
  selectors?: {
    root: string;
    closeButton: string;
  }
}

export type PopupClickCallback = (event: PopupClickEvent) => void;

export interface PopupClickEvent {
  data: any;

  /**
   * Optional
   * 
   * The event object from clicking the close button
   */
  event?: Event;
}

/**
 * BasePopupComponent
 * 
 * The popup component also features a close handler by simply adding data-close attribute to an element.
 * 
 * Usage:
 * 
 * class MyPopup extends BasePopupComponent {
 * 
 *    template = 'my popup';
 * 
 * }
 * 
 * const myPopup = new MyPopup();
 * 
 * myPopup.show();
 * 
 */
export class BasePopupComponent {

  popupEl?: Element;
  closeButton?: BaseButtonComponent;

  static readonly EVENTS = {
    ON_CLOSE: 'onClose',
    ON_BTN_CLICK: 'onClick'
  };

  /**
   * Designated id of the popup component. Must be unique, as this is used in the DOM as well. This needs to be overriden.
   */
  protected id: string = 'base-popup';

  /**
   * String literal template containing the dom elements of the popup.
   */
  protected template: string = ``;

  private isRendered: boolean = false;
  protected options?: PopupOptions;
  protected pubSub = new PubSub();

  constructor(
    options?: PopupOptions
  ) {
    this.options = {
      selectors: DEFAULT_SELECTORS,
      ...options
    };
    this._init();
  }
  
  /**
   * This method is automatically called. This is where you put your event bindings and other side effects, like pub/sub.
   */
  onInit() {

  }

  /**
   * Shows/Opens the popup
   */
  open() {
    if (!this.isRendered) this.render();
    this.setVisibility(true);
  }

  /**
   * Hides/Closes the popup
   */
  close(clickEventData?: PopupClickEvent) {
    this.setVisibility(false);
    this.pubSub.publish(BasePopupComponent.EVENTS.ON_CLOSE, clickEventData);
  }

  /**
   * Handle unsubscription and deleteing of DOM elements
   * 
   * When overriding, be sure to call super.destroy(); This ensures the popup element is removed.
   */
  destroy() {
    this.popupEl?.remove();
    this._removeEventListeners();
  }

  /**
   * Default click handler for popup buttons. Triggers this.close with the provided data with a fixed timeout of 300ms to allow button animations to show.
   * @param data {any} the data you wish to send to popup close subscribers.
   */
  handleClick(data: any, time = 300) {
    setTimeout(() => {
      this.close({ data });
    }, time);
  }

  /**
   * Button clicked event callback. Automatically called when an element with data-click attribute is clicked.
   * @param event 
   */
  onButtonClick(callback: PopupClickCallback) {
    return this.pubSub.subscribe(BasePopupComponent.EVENTS.ON_BTN_CLICK, callback);
  }

  /**
   * Close event callback. Automatically called when an element with data-click="close" attribute is clicked.
   * @param event 
   */
  onClose(callback: PopupClickCallback) {
    return this.pubSub.subscribe(BasePopupComponent.EVENTS.ON_CLOSE, callback);
  }
  
  render() {
    if (this.isRendered) return;

    const popupTemplate = POPUP_LAYOUT(this.id, this.template);
    const { root } = this.options.selectors;
    const rootEl = document.querySelector(root);
    rootEl.insertAdjacentHTML('beforeend', popupTemplate);
    this.popupEl = rootEl.querySelector(`#${this.id}`);

    if (!this.options.hideClose) {
      this.closeButton = new CancelButtonHtml({
        targetId: this.contentWrapperId
      });

      this.closeButton.onClick(() => {
        setTimeout(() => {
          this.close({ data: false });
        }, 300);
      });
    }
    this.isRendered = true;
  }

  get contentContainerId() {
    return `${this.id}-content-container`;
  }

  get contentWrapperId() {
    return `${this.id}-content-wrapper`;
  }
  /**
   * Initialiation logic,
   */
  private _init() {
    // this makes sure all overrides from child classes take place first.
    setTimeout(() => {
      this.render();
      this.onInit();
      this._addEventListeners();
    });
  }

  private _click = (event: Event) => {
    const target = event.target as HTMLElement;
    const closestTarget = target.closest(FIXED_SELECTORS.autoClickBind) as HTMLElement;
    const data = closestTarget.dataset.click;
    const isClose = data === 'close';
    const clickEventData = {
      data,
      event
    };

    // Added delay to visualize animation
    setTimeout(() => {
      if (isClose) {
        this.close(clickEventData);
      } else {
        this.pubSub.publish(BasePopupComponent.EVENTS.ON_BTN_CLICK, clickEventData);
      }
    }, 300);
  }

  private _addEventListeners() {
    const buttons = this.popupEl?.querySelectorAll(FIXED_SELECTORS.autoClickBind);
    if (!buttons?.length) return;

    buttons.forEach((button) => {
      button.addEventListener('click', this._click);
    });
  }

  private _removeEventListeners() {
    const buttons = this.popupEl?.querySelectorAll(FIXED_SELECTORS.autoClickBind);
    if (!buttons?.length) return;

    buttons.forEach((button) => {
      button.removeEventListener('click', this._click);
    });
  }

  private setVisibility(toggle: boolean) {
    if (toggle) {
      this.popupEl.classList.add(CSS_SHOW);
    } else {
      this.popupEl.classList.remove(CSS_SHOW);
    }
  }
}