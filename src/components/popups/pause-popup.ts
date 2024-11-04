import {CloseButtonHtml, CancelButton, RetryButtonHtml} from '@buttons';
import {CLICK, lang, loadImages} from '@common';
import {AudioPlayer} from '@components';
import AreYouSurePopUp from '@popups/sure-popup';
import {AUDIO_ARE_YOU_SURE, POPUP_BG_IMG} from '@constants';
import gameStateService from '@gameStateService';

export default class PausePopUp {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public imagesLoaded: boolean = false;
  public pop_up_image: HTMLImageElement;
  public callback: Function;
  public switchToLevelSelection: Function;
  public reloadScene: Function;
  public gameplayData: any;
  audioPlayer: AudioPlayer;
  retrySurePopup: AreYouSurePopUp;
  CloseSurePopup: AreYouSurePopUp;
  isRetryButtonClicked: boolean = false;
  isCloseButtonClicked: boolean = false;

  constructor(
    canvas,
    callback,
    switchToLevelSelection,
    reloadScene,
    gameplayData,
  ) {
    this.canvas = canvas;
    this.callback = callback;
    this.gameplayData = gameplayData;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;

    const selfIdElement = document.getElementById(
      'canvas',
    ) as HTMLCanvasElement;
    this.context = selfIdElement.getContext('2d');
    this.audioPlayer = new AudioPlayer();

    new CancelButton(() => {
      this.callback();
    });
    new RetryButtonHtml(() => {
      if (lang === 'english') {
        this.isRetryButtonClicked = true;
        this.retrySurePopup.addListner();
        this.playAreYouSureSound();
      } else {
        this.handleRetryPublish();
        this.reloadScene(this.gameplayData, 'GamePlay');
      }
    });

    new CloseButtonHtml(() => {
      if (lang === 'english') {
        this.isCloseButtonClicked = true;
        this.CloseSurePopup.addListner();
        this.playAreYouSureSound();
      } else {
        this.handleClosePublish();
        this.switchToLevelSelection('GamePlay');
      }
    });

    loadImages({pop_up_image: POPUP_BG_IMG}, images => {
      this.pop_up_image = images['pop_up_image'];
      this.imagesLoaded = true;
    });

    this.retrySurePopup = new AreYouSurePopUp(
      this.canvas,
      this.yesRetryCallback,
      this.noRetryCallback,
    );
    this.CloseSurePopup = new AreYouSurePopUp(
      this.canvas,
      () => {
        this.handleClosePublish();
        this.switchToLevelSelection();
      },
      this.noCloseCallback,
    );
  }

  yesRetryCallback = () => {
    this.handleRetryPublish();
    this.reloadScene('GamePlay');
  };

  noRetryCallback = () => {
    if (this.isRetryButtonClicked) {
      this.isRetryButtonClicked = false;
      gameStateService.publish(
        gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
        false,
      );
      this.callback();
    }
  };

  noCloseCallback = () => {
    if (this.isCloseButtonClicked) {
      gameStateService.publish(
        gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
        false,
      );
      this.isCloseButtonClicked = false;
      this.callback();
    }
  };

  private handleRetryPublish() {
    gameStateService.publish(
      gameStateService.EVENTS.GAMEPLAY_DATA_EVENT,
      this.gameplayData,
    );
    gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
  }

  private handleClosePublish() {
    gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
    gameStateService.publish(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      false,
    );
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.fillStyle = 'rgba(0,0,0,0.5)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(
        this.pop_up_image,
        this.canvas.width * 0.1,
        this.canvas.height * 0.2,
        this.canvas.width * 0.8,
        this.canvas.width * 0.8,
      );
      if (this.isRetryButtonClicked && lang === 'english')
        this.retrySurePopup.draw();
      if (this.isCloseButtonClicked && lang === 'english')
        this.CloseSurePopup.draw();
    }
  }

  playAreYouSureSound = () => {
    this.audioPlayer.playAudio(AUDIO_ARE_YOU_SURE);
  };
}
