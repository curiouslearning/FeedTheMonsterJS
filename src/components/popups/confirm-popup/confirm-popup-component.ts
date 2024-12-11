import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import CancelButtonHtml from '@components/buttons/cancel-button/cancel-button';
import YesButtonHtml from '@components/buttons/yes-button/yes-button';
import { BasePopupComponent } from '@components/popups/base-popup/base-popup-component';

export class ConfirmPopupComponent extends BasePopupComponent {
  confirmButton?: BaseButtonComponent;
  cancelButton?: BaseButtonComponent;
  private enableTimeoutId?: number; // Store the timeout ID to clear it later

  protected override id = 'confirm-popup';
  protected override template = `
    <div class="confirm-message text-align-center w-100 mb-3 font-size-3">Are you sure?</div>
    <div id="confirm-button-container" class="button-container d-flex justify-content-center w-100"></div>
  `;

  onInit() {
    const targetId = 'confirm-button-container';

    this.cancelButton = new CancelButtonHtml({ id: this.createButtonId('cancel-button'), targetId, className: 'me-4' });
    this.cancelButton.onClick(() => this.handleClick(false));

    this.confirmButton = new YesButtonHtml({ id: this.createButtonId('confirm-button'), targetId });
    this.confirmButton.onClick(() => this.handleClick(true));
  }

  createButtonId(buttonName: string) {
    return `${this.id}-${buttonName}`;
  }

  handleClick(data: boolean) {
    // Disable both buttons to prevent further clicks
    this.disableButtons();

    // Call the base click handler and pass the click data
    super.handleClick(data);

    // Re-enable buttons after a delay
    this.scheduleEnableButtons(800); // 2000ms = 2 seconds delay (change as needed)
  }

  disableButtons() {
    this.confirmButton?.setDisabled(true);
    this.cancelButton?.setDisabled(true);
  }

  enableButtons() {
    this.confirmButton?.setDisabled(false);
    this.cancelButton?.setDisabled(false);
  }

  /**
   * Schedule enabling the buttons after a delay.
   * The existing timeout is cleared to prevent multiple scheduled timeouts.
   * 
   * @param delay - The delay in milliseconds before buttons are re-enabled.
   */
  scheduleEnableButtons(delay: number) {
    // Clear any existing timeout to prevent multiple scheduled re-enables
    if (this.enableTimeoutId) {
      clearTimeout(this.enableTimeoutId);
    }

    // Schedule a new timeout and store its ID
    this.enableTimeoutId = window.setTimeout(() => {
      this.enableButtons();
      this.enableTimeoutId = undefined; // Clear the reference after execution
    }, delay);
  }

  /**
   * Called when the component is destroyed.
   * Clears any existing timeouts to prevent memory leaks.
   */
  destroy(): void {
    if (this.enableTimeoutId) {
      clearTimeout(this.enableTimeoutId);
    }
    super.destroy();
  }
}
