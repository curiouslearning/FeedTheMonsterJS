import { PLAY_BTN_IMG } from "@constants";
import {
  BaseButtonComponent,
  ButtonOptions,
} from '../base-button-component/base-button-component';
import './play-button.scss';

export default class PlayButtonHtml extends BaseButtonComponent {
  constructor(options: Partial<ButtonOptions> = {}) {
    super({
      id: options.id || 'play-button',
      className: options.className || 'play-button-image',
      imageSrc: options?.imageSrc || PLAY_BTN_IMG,
      imageAlt: options.imageAlt || 'Play Icon',
      targetId: options.targetId || 'game-scene',
      ...options, // Allows any additional overrides
    });
  }
}