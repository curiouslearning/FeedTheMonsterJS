import {CANCEL_BTN_IMG} from '@constants';
import {
  BaseButtonComponent,
  ButtonOptions,
} from '../base-button-component/base-button-component';

export default class CancelButtonHtml extends BaseButtonComponent {
  constructor(options: Partial<ButtonOptions> = {}) {
    super({
      id: options.id || 'cancel-button',
      className: options.className || 'cancel-button-image',
      imageSrc: CANCEL_BTN_IMG,
      imageAlt: options.imageAlt || 'Cancel Icon',
      targetId: options.targetId || 'game-control',
      ...options, // Allows any additional overrides
    });
  }
}
