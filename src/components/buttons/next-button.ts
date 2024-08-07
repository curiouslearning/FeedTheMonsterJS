import {
  Context,
  ImagesLoaded,
  ButtonImage,
  ButtonInterface,
  PosX,
  PosY,
} from "../../types/buttons";

export default class NextButton implements ButtonInterface {
  public posX: PosX;
  public posY: PosY;
  public context: Context;
  public width: number;
  public height: number;
  public imagesLoaded: ImagesLoaded = false;
  public button_image: ButtonImage;

  constructor(
    context: Context,
    width: number,
    height: number,
    posX: number,
    posY: number
  ) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.width = width;
    this.height = height;
    this.button_image = new Image();
    this.button_image.src = "./assets/images/next_btn.png";
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
        this.width * 0.19,
        this.width * 0.19
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    console.log("next button clicked");
    const distance = Math.sqrt(
      (xClick - this.posX - (this.width * 0.19) / 2) *
        (xClick - this.posX - (this.width * 0.19) / 2) +
        (yClick - this.posY - (this.width * 0.19) / 2) *
          (yClick - this.posY - (this.width * 0.19) / 2)
    );
    if (distance < (this.width * 0.19) / 2) {
      return true;
    }
    return false; // Added return statement to avoid potential runtime error
  }
}
