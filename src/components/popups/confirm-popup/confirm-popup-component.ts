import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';
import CancelButtonHtml from '@components/buttons/cancel-button/cancel-button';
import YesButtonHtml from '@components/buttons/yes-button/yes-button';
import { BasePopupComponent } from '@components/popups/base-popup/base-popup-component';

export class ConfirmPopupComponent extends BasePopupComponent {
  confirmButton?: BaseButtonComponent;
  cancelButton?: BaseButtonComponent;

  protected override id = 'confirm-popup';

  onInit() {
    const targetId = this.contentContainerId;

    this.cancelButton = new CancelButtonHtml({ id: this.createButtonId('cancel-button'),targetId, className: 'me-4' });
    this.cancelButton.onClick(() => this.handleClick(false));

    this.confirmButton = new YesButtonHtml({ id: this.createButtonId('confirm-button'), targetId });
    this.confirmButton.onClick(() => this.handleClick(true));
  }

  createButtonId(buttonName: string) {
    return `${this.id}-${buttonName}`;
  }
}