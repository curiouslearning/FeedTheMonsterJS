import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import CancelButtonHtml from '@components/buttons/cancel-button/cancel-button';
import YesButtonHtml from '@components/buttons/yes-button/yes-button';
import { BasePopupComponent } from '@components/popups/base-popup/base-popup-component';

export class ConfirmPopupComponent extends BasePopupComponent {
  confirmButton?: BaseButtonComponent;
  cancelButton?: BaseButtonComponent;

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
}