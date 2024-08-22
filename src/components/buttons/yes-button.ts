import {
  drawImageOnCanvas,
  isClickInsideButton,
  loadImages,
} from "../../common/utils";

export default class YesButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: any; height?: number };
  public imagesLoaded: boolean = false;
  public yes_button_image: HTMLImageElement;

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

    loadImages(
      { yes_button_image: "./assets/images/confirm_btn.png" },
      (images) => {
        this.yes_button_image = images["yes_button_image"];
        this.imagesLoaded = true;
      }
    );
  }

  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.yes_button_image,
        this.posX - 5,
        this.posY,
        this.canvas.width * 0.2,
        this.canvas.width * 0.2
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    return isClickInsideButton(
      xClick,
      yClick,
      this.posX,
      this.posY,
      this.canvas.width * 0.15
    );
  }
}
