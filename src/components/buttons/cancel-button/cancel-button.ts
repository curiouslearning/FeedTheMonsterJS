import {CANCEL_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '../base-button-component/base-button-component';
import {AudioPlayer} from '@components/audio-player';
import gameStateService from '@gameStateService';

export default class CancelButton extends BaseButtonComponent {
  constructor(onCancelAction: () => void) {
    const audioPlayer = new AudioPlayer();
    const isGamePaused =
      gameStateService.getGamePlaySceneDetails()?.isGamePaused;

    super({
      id: 'cancel-button',
      className: `cancel-button-image ${isGamePaused ? 'show' : 'hide'}`,
      onClick: () => {
        gameStateService.publish(
          gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
          false,
        );
        audioPlayer.playButtonClickSound();
        onCancelAction();
      },
      imageSrc: CANCEL_BTN_IMG,
      imageAlt: 'Cancel Icon',
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
    this.element.className = `dynamic-button cancel-button-image ${isPaused ? 'show' : 'hide'}`;
  }
}
