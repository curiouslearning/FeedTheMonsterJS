import {PAUSE_BTN_IMG} from '@constants';
import gameStateService from '@gameStateService';
import {BaseButtonComponent} from '../base-button-component/base-button-component';
import {AudioPlayer} from '@components/audio-player';

export default class PauseButton extends BaseButtonComponent {
  private audioPlayer: AudioPlayer;

  constructor(pauseGamePlay: () => void) {
    const audioPlayer = new AudioPlayer();
    const isGamePaused =
      gameStateService.getGamePlaySceneDetails()?.isGamePaused;

    // Initialize the button with className and event handling
    super({
      id: 'pause-button',
      className: `pause-button-image ${isGamePaused ? 'paused' : ''}`,
      onClick: () => {
        audioPlayer.playButtonClickSound();
        pauseGamePlay();
        gameStateService.publish(
          gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
          !isGamePaused,
        );
      },
      imageSrc: PAUSE_BTN_IMG,
      imageAlt: 'Pause Icon',
      targetId: 'game-control',
    });

    this.audioPlayer = audioPlayer;
    this.setupPauseStateListener();
  }

  private setupPauseStateListener() {
    gameStateService.subscribe(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      (isPaused: boolean) => {
        this.updateClassName(isPaused);
      },
    );
  }

  private updateClassName(isPaused: boolean) {
    // Only update pause-specific classes, as dynamic-button is handled in BaseButtonComponent
    this.element.className = `dynamic-button pause-button-image ${isPaused ? 'paused' : ''}`;
  }
}
