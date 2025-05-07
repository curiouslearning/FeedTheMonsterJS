import {PAUSE_BTN_IMG} from '@constants';
import {
  BaseButtonComponent,
  ButtonOptions,
} from '@components/buttons/base-button-component/base-button-component';

export default class PauseButton extends BaseButtonComponent {
  constructor(options: Partial<ButtonOptions> = {}) {
    super({
      id: options.id || 'pause-button',
      className: options.className || 'pause-button-image',
      imageSrc: PAUSE_BTN_IMG,
      imageAlt: options.imageAlt || 'Pause Icon',
      targetId: options.targetId || 'game-control',
      ...options, // Allows overriding any of these defaults if needed
    });
  }
}
