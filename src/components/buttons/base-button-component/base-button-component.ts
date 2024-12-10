import { AudioPlayer } from '@components/audio-player';

export interface ButtonOptions {
  id: string;
  className?: string;
  onClick?: () => void;
  imageSrc?: string;
  imageAlt?: string;
  targetId?: string;
}

export class BaseButtonComponent {
  protected id: string;
  protected element: HTMLElement;
  protected audioPlayer: AudioPlayer;
  private clickListener: (event: Event) => void;

  constructor(options: ButtonOptions) {
    this.id = options.id;
    this.audioPlayer = new AudioPlayer();
    const existingElement = document.getElementById(options.id);
    if (existingElement) {
      this.element = existingElement;
    } else {
      this.element = this.createButtonElement(options);
      this.injectButtonIntoTarget(options.targetId || 'game-control');
    }

    // If onClick provided during instantiation, bind it
    if (options.onClick) {
      this.onClick(options.onClick);
    }
  }

  // Public method to set the onClick handler
  public onClick(callback: () => void): void {
    this.clickListener = (event: Event) => {
      event.preventDefault();
      
      if (this.element.hasAttribute('disabled')) {
        // If the button is disabled, do nothing
        return;
      }

      if (this.audioPlayer) {
        this.audioPlayer.playButtonClickSound();
      }

      // Apply scale effect
      this.element.style.transform = 'scale(0.90)';

      // Reset scale after 100ms
      setTimeout(() => {
        this.element.style.transform = 'scale(1)';
      }, 100);

      callback();
    };

    this.element.addEventListener('click', this.clickListener);
  }

  private createButtonElement({
    id,
    className = '',
    imageSrc,
    imageAlt = 'Button Image',
  }: ButtonOptions): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <button id="${id}" class="dynamic-button ${className}">
        ${imageSrc ? `<img src="${imageSrc}" alt="${imageAlt}" class="button-image" />` : ''}
      </button>
    `;
    return wrapper.firstElementChild as HTMLElement;
  }

  private injectButtonIntoTarget(targetId: string): void {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.appendChild(this.element);
    }
  }

  // Method to disable or enable the button
  public setDisabled(isDisabled: boolean): void {
    if (isDisabled) {
      this.element.setAttribute('disabled', 'true');
      this.element.classList.add('disabled');
    } else {
      this.element.removeAttribute('disabled');
      this.element.classList.remove('disabled');
    }
  }

  // Method to dispose of the button, removing event listeners and cleaning up
  public dispose(): void {
    if (this.clickListener) {
      this.element.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
    this.audioPlayer = null;
  }

  // Optional getter for accessing the element
  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy() {
    const element = document.getElementById(this.id);
    if (element) element.remove();
  }
}
