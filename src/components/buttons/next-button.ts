import { drawImageOnCanvas, isClickInsideButton, loadImages } from "@common";
import { ButtonInterface } from "@interfaces/buttons";

export default class NextButton implements ButtonInterface {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  public imagesLoaded: boolean = false;
  public button_image: HTMLImageElement;

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

    loadImages({ button_image: "./assets/images/next_btn.png" }, (images) => {
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
        this.width * 0.19,
        this.width * 0.19
      );
    }
  }
  onClick(xClick: number, yClick: number): boolean {
    return isClickInsideButton(
      xClick,
      yClick,
      this.posX,
      this.posY,
      this.width * 0.19,
      this.width * 0.19
    );
  }
}
