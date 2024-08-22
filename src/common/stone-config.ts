import { font, lang } from "../../global-variables";
import { TimerTicking } from "../components/timer-ticking";
import { Tutorial } from "../components/tutorial";
import { drawImageOnCanvas, Utils } from "./utils";

export class StoneConfig {
  public x: number;
  public y: number;
  public origx: number;
  public origy: number;
  public text: string;
  public img: CanvasImageSource;
  public imageSize: number;
  public textFontSize: number;
  public canvasWidth: number;
  public canvasHeight: number;
  public imageCenterOffsetX: number;
  public imageCenterOffsetY: number;
  public context: CanvasRenderingContext2D;
  public tutorialInstance: Tutorial;
  public timerTickingInstance: TimerTicking;
  public frame: number = 0;

  constructor(
    context,
    canvasWidth,
    canvasHeight,
    stoneLetter,
    xPos,
    yPos,
    img,
    timerTickingInstance,
    tutorialInstance?
  ) {
    this.x = xPos;
    this.y = yPos;
    this.origx = xPos;
    this.origy = yPos;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.tutorialInstance = tutorialInstance;
    this.text = stoneLetter;
    this.img = img;
    this.context = context;
    this.calculateImageAndFontSize();
    this.imageCenterOffsetX = this.imageSize / 2.3;
    this.imageCenterOffsetY = this.imageSize / 1.5;
    this.timerTickingInstance = timerTickingInstance;
  }

  calculateImageAndFontSize() {
    if (
      this.context.measureText(this.text).width * 1.4 >
      this.canvasHeight / 13
    ) {
      this.imageSize = this.context.measureText(this.text).width * 1.1;
      this.textFontSize = this.canvasHeight / 25;
      if (
        this.text.length >= 3 &&
        this.origx < 50 &&
        this.origx < this.canvasWidth / 2
      ) {
        this.x = this.origx + 25;
      }
    } else {
      this.imageSize = this.canvasHeight / 13;
      this.textFontSize = this.canvasHeight / 20;
    }
  }

  getEase = (currentProgress, start, distance, steps) => {
    return (
      (-distance / 2) * (Math.cos((Math.PI * currentProgress) / steps) - 1) +
      start
    );
  };

  getX = () => {
    if (this.frame >= 100) {
      // Animation has ended, return the final stone position
      return this.x;
    }
    return this.getEase(this.frame, 0, this.x, 100);
  };

  getY = () => {
    if (this.frame >= 100) {
      // Animation has ended, return the final stone position
      return this.y;
    }

    return this.getEase(this.frame, 0, this.y, 100);
  };

  draw(deltaTime: number) {
    drawImageOnCanvas(
      this.context,
      this.img,
      this.getX() - this.imageCenterOffsetX,
      this.getY() - this.imageCenterOffsetY,
      this.imageSize,
      this.imageSize
    );
    this.context.fillStyle = "white";
    this.context.font = this.textFontSize + `px ${font}, monospace`;
    this.context.textAlign = "center";
    this.context.fillText(this.text, this.getX(), this.getY());
    if (this.frame < 100) {
      this.frame = this.frame + 1;
    } else if (
      this.tutorialInstance != null ||
      this.tutorialInstance != undefined
    ) {
      this.tutorialInstance.draw(deltaTime, this.img, this.imageSize);
    }
  }
}
