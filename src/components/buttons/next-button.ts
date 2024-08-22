// import { Game } from "../../../scenes/game";

import { drawImageOnCanvas, isClickWithinButton, loadImages } from "../../common/utils";

export default class NextButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  public imagesLoaded: boolean = false;
  public next_button_image: HTMLImageElement;

  constructor(
    context: CanvasRenderingContext2D,
    width,
    height,
    posX: number,
    posY: number
  ) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.width = width;
    this.height = height;

    loadImages(
      { next_button_image: "./assets/images/next_btn.png" },
      (images) => {
        this.next_button_image = images["next_button_image"];
        this.imagesLoaded = true;
      }
    );
  }
  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.next_button_image,
        this.posX,
        this.posY,
        this.width * 0.19,
        this.width * 0.19
      );
    }
  }
  onClick(xClick: number, yClick: number): boolean {
    // const distance = Math.sqrt(
    //   (xClick - this.posX - (this.width * 0.19) / 2) *
    //     (xClick - this.posX - (this.width * 0.19) / 2) +
    //     (yClick - this.posY - (this.width * 0.19) / 2) *
    //       (yClick - this.posY - (this.width * 0.19) / 2)
    // );
    // if (distance < (this.width * 0.19) / 2) {
    //   return true;
    // }

    return isClickWithinButton(
      xClick,
      yClick,
      this.posX + (this.width * 0.19) / 2,
      this.posY + (this.width * 0.19) / 2,
      (this.width * 0.19) / 2
    );
  }
}
