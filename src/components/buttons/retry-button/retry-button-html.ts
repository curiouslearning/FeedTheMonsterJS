import {RETRY_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '../base-button-component/base-button-component';
import {AudioPlayer} from '@components/audio-player';

export default class RetryButtonHtml extends BaseButtonComponent {
  constructor(
    customId = 'retry-button',
    customClassName = 'retry-button-image',
    customImageAlt = 'Retry Icon',
    customTargetId = 'game-control',
  ) {
    // Initialize the button component with customizable options
    super({
      id: customId,
      className: `${customClassName}`,
      imageSrc: RETRY_BTN_IMG,
      imageAlt: customImageAlt,
      targetId: customTargetId,
    });

    this.audioPlayer = new AudioPlayer();
  }
}
