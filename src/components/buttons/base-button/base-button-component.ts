interface ButtonOptions {
  label?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  targetId?: string; // Optional target container ID for dynamic injection
}

export class BaseButtonComponent {
  private element: HTMLButtonElement;

  constructor(options: ButtonOptions) {
    this.element = document.createElement("button");
    this.applyOptions(options);
    this.injectButton(options.targetId);
  }

  private applyOptions(options: ButtonOptions): void {
    const { label, onClick, className, disabled } = options;

    if (label) {
      this.element.textContent = label;
    }

    if (onClick) {
      this.addEventListeners(onClick);
    }

    if (className) {
      this.element.className = className;
    }

    if (disabled) {
      this.element.disabled = disabled;
    }
  }

  private addEventListeners(onClick: () => void): void {
    this.element.addEventListener("click", (event) => {
      event.preventDefault();
      onClick();
    });

    this.element.addEventListener("touchstart", (event) => {
      event.preventDefault();
      onClick();
    });
  }

  private injectButton(targetId?: string): void {
    let targetElement: HTMLElement | null = null;

    // Use a default target if no specific target ID is provided
    if (targetId) {
      targetElement = document.getElementById(targetId);
    }

    // Fallback to a default target like '#background-elements' or 'body' if not specified
    if (!targetElement) {
      targetElement =
        document.getElementById("background-elements") || document.body;
    }

    targetElement.appendChild(this.element);
  }

  public getElement(): HTMLButtonElement {
    return this.element;
  }
}

// sample implementation
// in pause-button.ts
// import { BaseButtonComponent } from "./base-button/base-button-component";
// export default class PauseButton extends BaseButtonComponent {
//   constructor() {
//     super({
//       label: 'Pause',
//       className: 'pause-button',
//       onClick: () => {
//         console.log('Pause button clicked or touched');
//         gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
//       },
//     });

//     this.injectButtonIntoTarget();
//   }

//   private injectButtonIntoTarget(): void {
//     // Define the target element ID directly
//     const targetElement = document.getElementById('game-control');
//     if (targetElement) {
//       // Append the button to the target element
//       targetElement.appendChild(this.getElement());
//     } else {
//       console.error("Target element 'game-control' not found.");
//     }
//   }
// }
