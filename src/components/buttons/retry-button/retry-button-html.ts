import {RETRY_BTN_IMG} from '@constants';
import {
  BaseButtonComponent,
  ButtonOptions,
} from '../base-button-component/base-button-component';

export default class RetryButtonHtml extends BaseButtonComponent {
  constructor(options: Partial<ButtonOptions> = {}) {
    super({
      id: options.id || 'retry-button',
      className: options.className || 'retry-button-image',
      imageSrc: RETRY_BTN_IMG,
      imageAlt: options.imageAlt || 'Retry Icon',
      targetId: options.targetId || 'game-control',
      ...options, // Allows for additional overrides
    });
  }
}
