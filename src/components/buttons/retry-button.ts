import { isClickInsideButton, loadImages } from "@common";
import { RETRY_BUTTON } from "@constants";

export default class RetryButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;
  public imagesLoaded: boolean = false;
  public retry_button_image: HTMLImageElement;

  constructor(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    posX: number,
    posY: number
  ) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.canvas = canvas;

    loadImages({ yes_button_image: RETRY_BUTTON }, (images) => {
      this.retry_button_image = images["yes_button_image"];
      this.imagesLoaded = true;
    });
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.retry_button_image,
        this.posX,
        this.posY,
        this.canvas.width * 0.19,
        this.canvas.width * 0.19
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    return isClickInsideButton(
      xClick,
      yClick,
      this.posX,
      this.posY,
      this.canvas.width * 0.19,
      this.canvas.width * 0.19
    );
  }
}
