import { YES_BTN_IMG } from '@constants';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';

export default class YesButtonHtml extends BaseButtonComponent {
  constructor(
    customId = 'yes-button',
    customClassName = 'yes-button-image',
    customImageAlt = 'Yes Icon',
    customTargetId = 'game-control'
  ) {
    super({
      id: customId,
      className: customClassName,
      imageSrc: YES_BTN_IMG,
      imageAlt: customImageAlt,
      targetId: customTargetId,
    });
  }
}
