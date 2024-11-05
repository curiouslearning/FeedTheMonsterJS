import {CANCEL_BTN_IMG} from '@constants';
import {BaseButtonComponent} from '../base-button-component/base-button-component';
import {AudioPlayer} from '@components/audio-player';
import gameStateService from '@gameStateService';

export default class NoButton extends BaseButtonComponent {
  private audioPlayer: AudioPlayer;

  constructor(onNoAction: () => void) {
    // Initialize the button component with options and click handling
    super({
      id: 'no-button',
      className: 'no-button-image',
      onClick: () => {
        this.audioPlayer.playButtonClickSound();
        onNoAction();
      },
      imageSrc: CANCEL_BTN_IMG,
      imageAlt: 'No Icon',
      targetId: 'game-control',
    });

    // Initialize audio player after calling super()
    this.audioPlayer = new AudioPlayer();

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
    this.element.className = `dynamic-button no-button-image ${isPaused ? 'show' : 'hide'}`;
  }
}
