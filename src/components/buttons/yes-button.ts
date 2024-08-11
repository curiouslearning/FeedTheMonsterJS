// YesButton.ts

import {
  Context,
  Canvas,
  ImagesLoaded,
  ButtonImage,
  ButtonInterface,
  PosX,
  PosY,
} from "../../interfaces/buttons";

export default class YesButton implements ButtonInterface {
  public posX: PosX;
  public posY: PosY;
  public context: Context;
  public canvas: Canvas;
  public imagesLoaded: ImagesLoaded = false;
  public button_image: ButtonImage;

  constructor(context: Context, canvas: Canvas, posX: number, posY: number) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.canvas = canvas;

    this.button_image = new Image();
    this.button_image.src = "./assets/images/confirm_btn.png";
    this.button_image.onload = (e) => {
      this.imagesLoaded = true;
      this.button_image = this.button_image;
    };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.button_image,
        this.posX - 5,
        this.posY,
        this.canvas.width * 0.2,
        this.canvas.width * 0.2
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    console.log("yes button clicked");
    const distance = Math.sqrt(
      (xClick - this.posX - (this.canvas.width * 0.15) / 2) *
        (xClick - this.posX - (this.canvas.width * 0.15) / 2) +
        (yClick - this.posY - (this.canvas.width * 0.15) / 2) *
          (yClick - this.posY - (this.canvas.width * 0.15) / 2)
    );
    if (distance < (this.canvas.width * 0.15) / 2) {
      return true;
    }
    return false; // Added return statement to avoid potential runtime error
  }
}
