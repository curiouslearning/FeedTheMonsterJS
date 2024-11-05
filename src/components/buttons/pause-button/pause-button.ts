import {PAUSE_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '@components/buttons/base-button-component/base-button-component';

export default class PauseButton extends BaseButtonComponent {
  constructor() {
    super({
      id: 'pause-button',
      className: 'pause-button-image',
      imageSrc: PAUSE_BTN_IMG,
      imageAlt: 'Pause Icon',
      targetId: 'game-control',
    });
  }
}
