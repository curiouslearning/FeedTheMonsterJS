import {MAP_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '../base-button-component/base-button-component';
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
      targetId: 'game-control',
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
    this.element.className = `dynamic-button close-button-image ${isPaused ? 'show' : 'hide'}`;
  }
}
