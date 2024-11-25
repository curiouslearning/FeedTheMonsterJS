import {NEXT_BTN_IMG} from '@constants';
import {
  BaseButtonComponent,
  ButtonOptions,
} from '../base-button-component/base-button-component';

export default class NextButtonHtml extends BaseButtonComponent {
  constructor(options: Partial<ButtonOptions> = {}) {
    super({
      id: options.id || 'next-button',
      className: options.className || 'next-button-image',
      imageSrc: NEXT_BTN_IMG,
      imageAlt: options.imageAlt || 'Next Icon',
      targetId: options.targetId || 'game-control',
      ...options, // Allows for additional overrides
    });
  }
}
