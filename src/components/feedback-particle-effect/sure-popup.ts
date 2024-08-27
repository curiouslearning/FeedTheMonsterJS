import { CLICK } from "@common/event-names";
import { AudioPlayer } from "../audio-player";
import YesButton from "../buttons/yes-button";
import NoButton from "../buttons/no-button";
import { drawImageOnCanvas, loadImages } from "@common";

export default class AreYouSurePopUp {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public yesButton: YesButton;
  public noButton: NoButton;
  public imagesLoaded: boolean = false;
  public pop_up_image: HTMLImageElement;
  public yesCallback: Function;
  public noCallback: Function;
  audioPlayer: AudioPlayer;

  constructor(canvas, yesCallback, noCallback) {
    this.canvas = canvas;
    this.yesCallback = yesCallback;
    this.noCallback = noCallback;
    this.context = this.canvas.getContext("2d");
    this.audioPlayer = new AudioPlayer();
    this.yesButton = new YesButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.55,
      this.canvas.height * 0.2 +
        this.canvas.width * 0.4 -
        (this.canvas.width * 0.15) / 2
    );
    this.noButton = new NoButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.25,
      this.canvas.height * 0.2 +
        this.canvas.width * 0.4 -
        (this.canvas.width * 0.15) / 2
    );

    loadImages({ popupImage: "./assets/images/popup_bg_v01.png" }, (images) => {
      this.pop_up_image = images.popupImage;
      this.imagesLoaded = true;
    });
  }

  addListener = () => {
    this.canvas.addEventListener(CLICK, this.handleMouseClick, false);
  };

  handleMouseClick = (event) => {
    const selfElement = <HTMLElement>document.getElementById("canvas");
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.yesButton.onClick(x, y)) {
      // console.log(" Yes button clicked");
      this.playClickSound();
      this.dispose();
      this.yesCallback();
    }
    if (this.noButton.onClick(x, y)) {
      // console.log(" No button clicked");
      this.playClickSound();
      this.dispose();
      this.noCallback();
    }
  };

  draw() {
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
      const textY = this.canvas.height * 0.2 + 80;
      this.context.fillStyle = "white";
      this.context.font = "24px Arial";
      this.context.fillText(
        "Are you sure?",
        this.canvas.width / 2,
        this.canvas.height / 2.8
      );
      this.yesButton.draw();
      this.noButton.draw();
    }
  }
  playClickSound = () => {
    this.audioPlayer.playButtonClickSound();
  };
  dispose = () => {
    this.canvas.removeEventListener(CLICK, this.handleMouseClick, false);
  };
}
