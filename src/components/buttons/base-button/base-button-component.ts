interface ButtonOptions {
  id: string;
  className?: string;
  onClick?: () => void;
  imageSrc?: string;
  imageAlt?: string;
  targetId?: string;
}

export class BaseButtonComponent {
  private element: HTMLElement;

  constructor(options: ButtonOptions) {
    this.element = this.createButtonElement(options);
    this.injectButtonIntoTarget(
      options.targetId || 'game-control',
      options.onClick,
    );
  }

  private createButtonElement({
    id,
    className = '',
    imageSrc,
    imageAlt = 'Button Image',
  }: ButtonOptions): HTMLElement {
    // Create the button using a template literal for simplicity
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <button id="${id}" class="dynamic-button ${className}">
        ${imageSrc ? `<img src="${imageSrc}" alt="${imageAlt}" class="button-image" />` : ''}
      </button>
    `;

    return wrapper.firstElementChild as HTMLElement;
  }

  private injectButtonIntoTarget(targetId: string, onClick?: () => void): void {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.appendChild(this.element);

      if (onClick) {
        const eventHandler = (event: Event) => {
          event.preventDefault();
          onClick();
        };

        ['click', 'touchstart'].forEach(eventType =>
          this.element.addEventListener(eventType, eventHandler),
        );
      }
    } else {
      console.error(`Target element '${targetId}' not found.`);
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}

// example usage in pause-button.ts
// import {PAUSE_BTN_IMG} from '@constants';
// import gameStateService from '@gameStateService';

// import {BaseButtonComponent} from './base-button/base-button-component';

// export default class PauseButton extends BaseButtonComponent {
//   constructor() {
//     super({
//       id: 'pause-button',
//       className: 'pause-button-image',
//       onClick: () => {
//         console.log('Pause button clicked or touched');
//         gameStateService.publish(
//           gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
//           true, // isGamePaused
//         );
//       },
//       imageSrc: PAUSE_BTN_IMG,
//       imageAlt: 'Pause Icon',
//     });
//   }
// }
