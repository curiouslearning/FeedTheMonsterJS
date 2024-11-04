import {CANCEL_BTN_IMG} from '@constants';
import {BaseButtonComponent} from './base-button/base-button-component';
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

  private updateVisibility(isPaused: boolean) {
    // Toggle 'show' and 'hide' classes based on the pause state
    if (isPaused) {
      this.element.classList.add('show');
      this.element.classList.remove('hide');
    } else {
      this.element.classList.add('hide');
      this.element.classList.remove('show');
    }
  }
}
