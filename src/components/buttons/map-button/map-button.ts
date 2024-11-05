import {MAP_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '../base-button-component/base-button-component';

export default class MapButton extends BaseButtonComponent {
  constructor(
    customId = 'close-button',
    customClassName = 'close-button-image',
    customImageAlt = 'Close Icon',
    customTargetId = 'game-control',
  ) {
    super({
      id: customId,
      className: customClassName,
      imageSrc: MAP_BTN_IMG,
      imageAlt: customImageAlt,
      targetId: customTargetId,
    });
  }
}
