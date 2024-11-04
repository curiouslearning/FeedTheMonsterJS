import {YES_BTN_IMG} from '@constants';
import {BaseButtonComponent} from './base-button/base-button-component';
import {AudioPlayer} from '@components/audio-player';
import gameStateService from '@gameStateService';

export default class YesButton extends BaseButtonComponent {
  private audioPlayer: AudioPlayer;

  constructor(onYesAction: () => void) {
    // Initialize the button component with options and click handling
    super({
      id: 'yes-button',
      className: 'yes-button-image',
      onClick: () => {
        this.audioPlayer.playButtonClickSound();
        onYesAction();
      },
      imageSrc: YES_BTN_IMG,
      imageAlt: 'Yes Icon',
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
