import {
  drawImageOnCanvas,
  isClickInsideButton,
  loadImages,
} from "@common";
import {
  ButtonImage,
  ButtonInterface,
  Canvas,
  Context,
  ImagesLoaded,
  PosX,
  PosY,
} from "@interfaces/buttons";

export default class RetryButton implements ButtonInterface {
  public posX: PosX;
  public posY: PosY;
  public context: Context;
  public canvas: Canvas;
  public imagesLoaded: ImagesLoaded = false;
  public button_image: ButtonImage;

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

    loadImages({ button_image: "./assets/images/retry_btn.png" }, (images) => {
      this.button_image = images["button_image"];
      this.imagesLoaded = true;
    });
  }

  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.button_image,
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
      this.canvas.width * 0.19
    );
  }
}
