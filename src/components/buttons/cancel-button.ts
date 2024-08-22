import {
  drawImageOnCanvas,
  isClickInsideButton,
  loadImages,
} from "../../common/utils";

export default class CancelButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: any; height?: number };
  public imagesLoaded: boolean = false;
  public cancel_button_image: HTMLImageElement;

  constructor(
    context: CanvasRenderingContext2D,
    canvas: { width: number; height?: number }
  ) {
    this.posX = canvas.width * 0.1 + (canvas.width * 0.15) / 2;
    this.posY = canvas.height * 0.2;
    this.context = context;
    this.canvas = canvas;

    loadImages(
      { cancel_button_image: "./assets/images/close_btn.png" },
      (images) => {
        this.cancel_button_image = images["cancel_button_image"];
        this.imagesLoaded = true;
      }
    );
  }

  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.cancel_button_image,
        this.posX,
        this.posY,
        this.canvas.width * 0.15,
        this.canvas.width * 0.15
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
