import { CloseButton, CancelButton, RetryButton } from "@buttons";
import { CLICK, lang, loadImages } from "@common";
import { AudioPlayer } from "@components";
import AreYouSurePopUp from "@popups/sure-popup";
import { AUDIO_ARE_YOU_SURE, POPUP_BG_IMG } from "@constants";
import gameStateService from '@gameStateService';

/**
 * Canvas-based pause popup component.
 * 
 * @deprecated no longer used. We are now using the html version
 */
export default class PausePopUp {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public cancelButton: CancelButton;
  public retryButton: RetryButton;
  public closeButton: CloseButton;
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
    gameplayData
  ) {
    this.canvas = canvas;
    this.callback = callback;
    this.gameplayData = gameplayData;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;

    const selfIdElement = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement;
    this.context = selfIdElement.getContext("2d");
    this.audioPlayer = new AudioPlayer();
    this.cancelButton = new CancelButton(this.context, this.canvas);
    this.retryButton = new RetryButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.55,
      this.canvas.height * 0.2 +
        this.canvas.width * 0.4 -
        (this.canvas.width * 0.19) / 2
    );
    this.closeButton = new CloseButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.25,
      this.canvas.height * 0.2 +
        this.canvas.width * 0.4 -
        (this.canvas.width * 0.19) / 2
    );

    loadImages({ pop_up_image: POPUP_BG_IMG }, (images) => {
      this.pop_up_image = images["pop_up_image"];
      this.imagesLoaded = true;
    });

    this.retrySurePopup = new AreYouSurePopUp(
      this.canvas,
      this.yesRetryCallback,
      this.noRetryCallback
    );
    this.CloseSurePopup = new AreYouSurePopUp(
      this.canvas,
      () => {
        //Temp fix just to properly connect all buttons to properly loading and pausing the game.
        //To do - Need to improved AreYouSurePopUp and this needs to be cleaned up.
        this.handleClosePublish();
        this.switchToLevelSelection();
      },
      this.noCloseCallback
    );
  }
  yesRetryCallback = () => {
    this.playClickSound();
    this.handleRetryPublish();
    this.reloadScene("GamePlay");
  };
  noRetryCallback = () => {
    if (this.isRetryButtonClicked) {
      this.isRetryButtonClicked = false;
      gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
      this.callback();
    }
  };
  noCloseCallback = () => {
    if (this.isCloseButtonClicked) {
      gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
      this.isCloseButtonClicked = false;
      this.callback();
    }
  };
  addListner = () => {
    document
      .getElementById("canvas")
      .addEventListener(CLICK, this.handleMouseClick, false);
  };

  private handleRetryPublish() {
    gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, this.gameplayData);
    gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
  }

  private handleClosePublish() {
    gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
  }

  handleMouseClick = (event) => {
    const selfElement = <HTMLElement>document.getElementById("canvas");
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.cancelButton.onClick(x, y)) {
      gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
      this.playClickSound();
      this.callback();
    }
    if (this.retryButton.onClick(x, y)) {
      if (lang == "english") {
        this.playClickSound();
        this.dispose();
        this.isRetryButtonClicked = true;
        this.retrySurePopup.addListner();
        this.playAreYouSureSound();
      } else {
        this.playClickSound();
        this.dispose();
        this.handleRetryPublish();
        this.reloadScene(this.gameplayData, "GamePlay");
      }
    }
    if (this.closeButton.onClick(x, y)) {
      if (lang == "english") {
        this.playClickSound();
        this.dispose();
        this.isCloseButtonClicked = true;
        this.CloseSurePopup.addListner();
        this.playAreYouSureSound();
      } else {
        this.playClickSound();
        this.dispose();
        this.handleClosePublish();
        this.switchToLevelSelection("GamePlay");
      }
    }
  };

  draw() {
    if (this.imagesLoaded) {
      this.context.fillStyle = "rgba(0,0,0,0.5)";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(
        this.pop_up_image,
        this.canvas.width * 0.1,
        this.canvas.height * 0.2,
        this.canvas.width * 0.8,
        this.canvas.width * 0.8
      );
      this.cancelButton.draw();
      this.retryButton.draw();
      this.closeButton.draw();
      if (this.isRetryButtonClicked == true && lang == "english")
        this.retrySurePopup.draw();
      if (this.isCloseButtonClicked == true && lang == "english")
        this.CloseSurePopup.draw();
    }
  }

  playClickSound = () => {
    this.audioPlayer.playButtonClickSound();
  };
  playAreYouSureSound = () => {
    this.audioPlayer.playAudio(AUDIO_ARE_YOU_SURE);
  };

  dispose = () => {
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
  };
}