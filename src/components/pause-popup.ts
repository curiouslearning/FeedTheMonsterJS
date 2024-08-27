import CancelButton from "@components/buttons/cancel-button";
import CloseButton from "@components/buttons/close-button";
import RetryButton from "@components/buttons/retry-button";
import { CLICK } from "@common/event-names";
import { AudioPlayer } from "./audio-player";
import AreYouSurePopUp from "./feedback-particle-effect/sure-popup";
import { lang } from "@constants/global-variables";
import { drawImageOnCanvas, loadImages } from "@common";

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

  private audioPlayer: AudioPlayer;
  private retrySurePopup: AreYouSurePopUp;
  private closeSurePopup: AreYouSurePopUp;
  private isRetryButtonClicked: boolean = false;
  private isCloseButtonClicked: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    callback: Function,
    switchToLevelSelection: Function,
    reloadScene: Function,
    gameplayData: any
  ) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.callback = callback;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;
    this.gameplayData = gameplayData;

    this.audioPlayer = new AudioPlayer();

    this.initializeButtons();
    this.initializePopups();
    this.loadImages();
  }

  private initializeButtons() {
    const buttonYPosition =
      this.canvas.height * 0.2 +
      this.canvas.width * 0.4 -
      (this.canvas.width * 0.19) / 2;

    this.cancelButton = new CancelButton(this.context, this.canvas);
    this.retryButton = new RetryButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.55,
      buttonYPosition
    );
    this.closeButton = new CloseButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.25,
      buttonYPosition
    );
  }

  private initializePopups() {
    this.retrySurePopup = new AreYouSurePopUp(
      this.canvas,
      this.yesRetryCallback,
      this.noRetryCallback
    );
    this.closeSurePopup = new AreYouSurePopUp(
      this.canvas,
      this.switchToLevelSelection,
      this.noCloseCallback
    );
  }

  private loadImages() {
    loadImages(
      { pop_up_image: "./assets/images/popup_bg_v01.png" },
      (images) => {
        this.pop_up_image = images.pop_up_image;
        this.imagesLoaded = true;
      }
    );
  }

  private manageEventListener(action: "add" | "remove") {
    const canvasElement = this.canvas;
    if (action === "add") {
      canvasElement.addEventListener(CLICK, this.handleMouseClick, false);
    } else {
      canvasElement.removeEventListener(CLICK, this.handleMouseClick, false);
    }
  }

  public addListener = () => {
    this.manageEventListener("add");
  };

  private handleMouseClick = (event: MouseEvent) => {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.cancelButton.onClick(x, y)) {
      this.handleCancel();
    } else if (this.retryButton.onClick(x, y)) {
      this.handleRetry();
    } else if (this.closeButton.onClick(x, y)) {
      this.handleClose();
    }
  };

  private handleCancel() {
    this.playClickSound();
    this.callback();
  }

  private handleRetry() {
    this.playClickSound();
    this.dispose();

    if (lang === "english") {
      this.isRetryButtonClicked = true;
      this.retrySurePopup.addListener();
      this.playAreYouSureSound();
    } else {
      this.reloadScene(this.gameplayData, "GamePlay");
    }
  }

  private handleClose() {
    this.playClickSound();
    this.dispose();

    if (lang === "english") {
      this.isCloseButtonClicked = true;
      this.closeSurePopup.addListener();
      this.playAreYouSureSound();
    } else {
      this.switchToLevelSelection("GamePlay");
    }
  }

  private yesRetryCallback = () => {
    this.playClickSound();
    this.reloadScene(this.gameplayData, "GamePlay");
  };

  private noRetryCallback = () => {
    if (this.isRetryButtonClicked) {
      this.isRetryButtonClicked = false;
      this.callback();
    }
  };

  private noCloseCallback = () => {
    if (this.isCloseButtonClicked) {
      this.isCloseButtonClicked = false;
      this.callback();
    }
  };

  public draw() {
    if (this.imagesLoaded) {
      this.context.fillStyle = "rgba(0,0,0,0.5)";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawImageOnCanvas(
        this.context,
        this.pop_up_image,
        this.canvas.width * 0.1,
        this.canvas.height * 0.2,
        this.canvas.width * 0.8,
        this.canvas.width * 0.8
      );
      this.cancelButton.draw();
      this.retryButton.draw();
      this.closeButton.draw();

      if (this.isRetryButtonClicked && lang === "english") {
        this.retrySurePopup.draw();
      }
      if (this.isCloseButtonClicked && lang === "english") {
        this.closeSurePopup.draw();
      }
    }
  }

  private playClickSound = () => {
    this.audioPlayer.playButtonClickSound();
  };

  private playAreYouSureSound = () => {
    this.audioPlayer.playAudio("./assets/audios/are-you-sure.mp3");
  };

  public dispose = () => {
    this.manageEventListener("remove");
  };
}
