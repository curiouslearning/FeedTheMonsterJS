import CancelButton from "../components/buttons/cancel-button";
import CloseButton from "../components/buttons/close-button";
import RetryButton from "../components/buttons/retry-button";
import { CLICK } from "../common/event-names";
import { AudioPlayer } from "./audio-player";

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
    this.pop_up_image = new Image();
    this.pop_up_image.src = "./assets/images/popup_bg_v01.png";
    this.pop_up_image.onload = (e) => {
      this.pop_up_image = this.pop_up_image;
      this.imagesLoaded = true;
    };

    // this.createCanvas();
  }

  addListner = () => {
    document
      .getElementById("canvas")
      .addEventListener(CLICK, this.handleMouseClick, false);
  };

  handleMouseClick = (event) => {
    const selfElement = <HTMLElement>document.getElementById("canvas");
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.cancelButton.onClick(x, y)) {
      console.log(" cancel button clicked");
      this.playClickSound();
      this.callback();
    }
    if (this.retryButton.onClick(x, y)) {
      this.playClickSound();
      this.dispose();
      console.log(" retry button clicked");
      this.reloadScene(this.gameplayData, "GamePlay");
    }
    if (this.closeButton.onClick(x, y)) {
      this.playClickSound();
      this.dispose();
      console.log(" close button clicked");
      this.switchToLevelSelection("GamePlay");
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
    }
  }


  playClickSound = () => {
    this.audioPlayer.playAudio("./assets/audios/ButtonClick.mp3");
  }

  dispose = () => {
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
  }
}
