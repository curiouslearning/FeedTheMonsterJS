import {
  PosX,
  PosY,
  Context,
  Canvas,
  ImagesLoaded,
  ButtonInterface,
  CloseButtonImage,
} from "../../types/buttons";

export default class CloseButton implements ButtonInterface {
  public posX: PosX;
  public posY: PosY;
  public context: Context;
  public canvas: Canvas;
  public imagesLoaded: ImagesLoaded = false;
  public button_image: CloseButtonImage;

  constructor(context: Context, canvas: Canvas, posX: PosX, posY: PosY) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.canvas = canvas;
    this.button_image = new Image();
    this.button_image.src = "./assets/images/map_btn.png";
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
        this.canvas.width * 0.19,
        this.canvas.width * 0.19
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    console.log("close button clicked");
    const distance = Math.sqrt(
      (xClick - this.posX - (this.canvas.width * 0.19) / 2) *
        (xClick - this.posX - (this.canvas.width * 0.19) / 2) +
        (yClick - this.posY - (this.canvas.width * 0.19) / 2) *
          (yClick - this.posY - (this.canvas.width * 0.19) / 2)
    );
    if (distance < (this.canvas.width * 0.19) / 2) {
      return true;
    }
    return false; // Added return statement to avoid potential runtime error
  }
}
