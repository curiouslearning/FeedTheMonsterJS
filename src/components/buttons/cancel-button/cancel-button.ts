import {CANCEL_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '../base-button-component/base-button-component';

export default class CancelButtonHtml extends BaseButtonComponent {
  constructor(
    customId = 'cancel-button',
    customClassName = 'cancel-button-image',
    customImageAlt = 'Cancel Icon',
    customTargetId = 'game-control',
  ) {
    super({
      id: customId,
      className: customClassName,
      imageSrc: CANCEL_BTN_IMG,
      imageAlt: customImageAlt,
      targetId: customTargetId,
    });
  }
}
