import {
  Context,
  Canvas,
  ImagesLoaded,
  ButtonImage,
  ButtonInterface,
  PosX,
  PosY,
} from "../../types/buttons";

export default class PauseButton implements ButtonInterface {
  public posX: PosX;
  public posY: PosY;
  public context: Context;
  public canvas: Canvas;
  public imagesLoaded: ImagesLoaded = false;
  public button_image: ButtonImage;

  constructor(context: Context, canvas: Canvas) {
    this.posX = (canvas.width ?? 0) - canvas.height * 0.09;
    this.posY = 0;
    this.context = context;
    this.canvas = canvas;

    this.button_image = new Image();
    this.button_image.src = "./assets/images/pause_v01.png";
    this.button_image.onload = (e) => {
      this.imagesLoaded = true;
      this.button_image = this.button_image;
    };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.button_image,
        this.posX,
        this.posY,
        this.canvas.height * 0.09,
        this.canvas.height * 0.09
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    console.log("pause button clicked");
    const distance = Math.sqrt(
      (xClick - this.posX - (this.canvas.height * 0.09) / 2) *
        (xClick - this.posX - (this.canvas.height * 0.09) / 2) +
        (yClick - this.posY - (this.canvas.height * 0.09) / 2) *
          (yClick - this.posY - (this.canvas.height * 0.09) / 2)
    );
    if (distance < (this.canvas.height * 0.09) / 2) {
      return true;
    }
    return false; // Added return statement to avoid potential runtime error
  }
}
