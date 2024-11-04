import {MAP_BTN_IMG} from '@constants';
import {BaseButtonComponent} from './base-button/base-button-component';
import gameStateService from '@gameStateService';
import {AudioPlayer} from '@components/audio-player';

export default class CloseButtonHtml extends BaseButtonComponent {
  constructor(onCloseAction: () => void) {
    const audioPlayer = new AudioPlayer();
    const isGamePaused =
      gameStateService.getGamePlaySceneDetails()?.isGamePaused;

    // Initialize the button component with image, click handling, and class visibility management
    super({
      id: 'close-button',
      className: `close-button-image ${isGamePaused ? 'show' : 'hide'}`,
      onClick: () => {
        console.log('onCloseAction', onCloseAction);
        audioPlayer.playButtonClickSound();
        onCloseAction();
      },
      imageSrc: MAP_BTN_IMG,
      imageAlt: 'Close Icon',
      targetId: 'pause-control',
    });

    this.setupPauseStateListener();
  }

  private setupPauseStateListener() {
    gameStateService.subscribe(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      (isPaused: boolean) => {
        this.updateVisibility(isPaused);
      },
    );
  }

  private updateVisibility(isPaused: boolean) {
    // Toggle 'show' and 'hide' classes based on real-time pause state
    if (isPaused) {
      this.element.classList.add('show');
      this.element.classList.remove('hide');
    } else {
      this.element.classList.add('hide');
      this.element.classList.remove('show');
    }
  }
}