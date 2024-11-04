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
    // Check if an element with the given ID already exists in the DOM
    const existingElement = document.getElementById(options.id);

    if (existingElement) {
      console.warn(
        `Button with ID '${options.id}' already exists. Reusing the existing element.`,
      );
      this.element = existingElement; // Reuse the existing DOM element
    } else {
      // Create the button element if it doesn't exist
      this.element = this.createButtonElement(options);
      this.injectButtonIntoTarget(
        options.targetId || 'game-control',
        options.onClick,
      );
    }
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
