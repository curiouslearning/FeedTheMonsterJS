export interface ButtonOptions {
  id: string;
  className?: string;
  onClick?: () => void;
  imageSrc?: string;
  imageAlt?: string;
  targetId?: string;
}

export class BaseButtonComponent {
  protected element: HTMLElement;

  constructor(options: ButtonOptions) {
    this.element =
      document.getElementById(options.id) || this.createButtonElement(options);
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
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <button id="${id}" class="dynamic-button ${className}">
        ${imageSrc ? `<img src="${imageSrc}" alt="${imageAlt}" class="button-image" />` : ''}
      </button>
    `;

    return wrapper.firstElementChild as HTMLElement;
  }

  animateButtonClick() {
    this.element.style.transform = 'scale(0.95)';

    setTimeout(() => {
      this.element.style.transform = 'scale(1)';
    }, 100);
  }

  private injectButtonIntoTarget(targetId: string, onClick?: () => void): void {
    const targetElement = document.getElementById(targetId);
    if (targetElement && !targetElement.contains(this.element)) {
      targetElement.appendChild(this.element);
    }

    if (onClick) {
      const eventHandler = (event: Event) => {
        event.preventDefault();
        this.animateButtonClick();
        onClick();
      };
      ['click', 'touchstart'].forEach(eventType =>
        this.element.addEventListener(eventType, eventHandler),
      );
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
