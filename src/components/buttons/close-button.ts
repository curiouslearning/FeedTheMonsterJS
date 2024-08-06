import {
  PosX,
  PosY,
  Context,
  Canvas,
  ImagesLoaded,
  CloseButtonType,
  CloseButtonImage
} from "../../types/buttons";

export default class CloseButton implements CloseButtonType {
  public posX: PosX;
  public posY: PosY;
  public context: Context;
  public canvas: Canvas;
  public imagesLoaded: ImagesLoaded = false;
  public close_button_image: CloseButtonImage;

  constructor(context: Context, canvas: Canvas, posX: PosX, posY: PosY) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.canvas = canvas;
    this.close_button_image = new Image();
    this.close_button_image.src = "./assets/images/map_btn.png";
    this.close_button_image.onload = (e) => {
      this.imagesLoaded = true;
      this.close_button_image = this.close_button_image;
    };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.close_button_image,
        this.posX,
        this.posY,
        this.canvas.width * 0.19,
        this.canvas.width * 0.19
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
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
