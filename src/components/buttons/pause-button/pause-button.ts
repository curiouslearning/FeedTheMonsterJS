import {PAUSE_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '@components/buttons/base-button-component/base-button-component';

export default class PauseButton extends BaseButtonComponent {
  constructor(
    customId = 'pause-button',
    customClassName = 'pause-button-image',
    customImageAlt = 'Pause Icon',
    customTargetId = 'game-control',
  ) {
    super({
      id: customId,
      className: customClassName,
      imageSrc: PAUSE_BTN_IMG,
      imageAlt: customImageAlt,
      targetId: customTargetId,
    });
  }
}
