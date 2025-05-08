import {YES_BTN_IMG} from '@constants';
import {
  BaseButtonComponent,
  ButtonOptions,
} from '@components/buttons/base-button-component/base-button-component';

export default class YesButtonHtml extends BaseButtonComponent {
  constructor(options: Partial<ButtonOptions> = {}) {
    super({
      id: options.id || 'yes-button',
      className: options.className || 'yes-button-image',
      imageSrc: YES_BTN_IMG,
      imageAlt: options.imageAlt || 'Yes Icon',
      targetId: options.targetId || 'game-control',
      ...options, // Allows for additional overrides if needed
    });
  }
}
