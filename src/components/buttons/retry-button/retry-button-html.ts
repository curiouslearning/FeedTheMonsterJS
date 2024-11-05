import {RETRY_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '../base-button-component/base-button-component';
import {AudioPlayer} from '@components/audio-player';
import gameStateService from '@gameStateService';

export default class RetryButtonHtml extends BaseButtonComponent {
  constructor(onRetryAction: () => void) {
    const audioPlayer = new AudioPlayer();
    const isGamePaused =
      gameStateService.getGamePlaySceneDetails()?.isGamePaused;

    // Initialize the button component with options and real-time class handling
    super({
      id: 'retry-button',
      className: `retry-button-image ${isGamePaused ? 'show' : 'hide'}`,
      onClick: () => {
        audioPlayer.playButtonClickSound();
        onRetryAction();
      },
      imageSrc: RETRY_BTN_IMG,
      imageAlt: 'Retry Icon',
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

  // Note:  this will potentially removed once popup is implemented
  private updateVisibility(isPaused: boolean) {
    this.element.className = `dynamic-button retry-button-image ${isPaused ? 'show' : 'hide'}`;
  }
}
