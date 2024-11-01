import { AudioPlayer } from '@components/audio-player';
import { CANCEL_BTN_IMG, POPUP_BG_IMG } from '@constants';
import { PubSub } from '../../../events/pub-sub-events';

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
    <div class="popup__content-wrapper" style="background-image: url(${POPUP_BG_IMG})">
      ${showClose ? `<div class="btn--icon" data-click="close"><img src="${CANCEL_BTN_IMG}"/></div>` : ''}
      <div class="popup__content-container">${content}</div>
    </div>
  </div>
`;

export interface PopupOptions {
  hideClose?: boolean;
  selectors: {
    root: string;
    closeButton: string;
  }
}

export type PopupClickCallback = (event: PopupClickEvent) => void;

export interface PopupClickEvent {
  data: any;
  event: Event;
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
  protected template = `
    <div>
      <h1>Base Popup Template</h1>
    </div>
  `;
  
  /**
   * Todo: move this to base button
   */
  private audioPlayer = new AudioPlayer();
  private isRendered: boolean = false;
  private popupEl?: Element;
  private clickCallback: PopupClickCallback = () => {};
  private closeCallback: PopupClickCallback = () => {};
  private pubSub = new PubSub();

  constructor(
    protected options: PopupOptions = { selectors: DEFAULT_SELECTORS }
  ) {
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
  show() {
    if (!this.isRendered) this.render();
    this.setVisibility(true);
  }

  /**
   * Hides/Closes the popup
   */
  hide() {
    this.setVisibility(false);
  }

  /**
   * Handle unsubscription and deleteing of DOM elements
   * 
   * When overriding, be sure to call super.destroy(); This ensures the popup element is removed.
   */
  destroy() {
    this.popupEl.remove();
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
    
    // Todo: move this to base button
    this.audioPlayer.playButtonClickSound();

    // Added delay to visualize animation
    setTimeout(() => {
      if (isClose) {
        this.hide();
        this.pubSub.publish(BasePopupComponent.EVENTS.ON_CLOSE, clickEventData);
      } else {
        this.pubSub.publish(BasePopupComponent.EVENTS.ON_BTN_CLICK, clickEventData);
      }
    }, 300);
  }

  private _addEventListeners() {
    const closeButtons = this.popupEl?.querySelectorAll(FIXED_SELECTORS.autoClickBind);
    if (!closeButtons.length) return;

    closeButtons.forEach((closeButton) => {
      closeButton.addEventListener('click', this._click);
    });
  }

  private render() {
    if (this.isRendered) return;

    const popupTemplate = POPUP_LAYOUT(this.id, this.template);
    const { root } = this.options.selectors;
    const rootEl = document.querySelector(root);
    rootEl.insertAdjacentHTML('beforeend', popupTemplate);
    this.popupEl = rootEl.querySelector(`#${this.id}`);
    this.isRendered = true;
  }

  private setVisibility(toggle: boolean) {
    if (toggle) {
      this.popupEl.classList.add(CSS_SHOW);
    } else {
      this.popupEl.classList.remove(CSS_SHOW);
    }
  }
}