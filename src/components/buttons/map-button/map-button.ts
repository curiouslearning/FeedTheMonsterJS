import {MAP_BTN_IMG} from '@constants';
import {
  BaseButtonComponent,
  ButtonOptions,
} from '../base-button-component/base-button-component';

export default class MapButton extends BaseButtonComponent {
  constructor(options: Partial<ButtonOptions> = {}) {
    super({
      id: options.id || 'close-button',
      className: options.className || 'close-button-image',
      imageSrc: MAP_BTN_IMG,
      imageAlt: options.imageAlt || 'Close Icon',
      targetId: options.targetId || 'game-control',
      ...options, // Allows any additional overrides
    });
  }
}
