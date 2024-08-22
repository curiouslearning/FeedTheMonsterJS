import {
  drawImageOnCanvas,
  isClickInsideButton,
  loadImages,
} from "../../common/utils";

export default class CloseButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;
  public imagesLoaded: boolean = false;
  public close_button_image: HTMLImageElement;

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
      { close_button_image: "./assets/images/map_btn.png" },
      (images) => {
        this.close_button_image = images["close_button_image"];
        this.imagesLoaded = true;
      }
    );
  }
  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.close_button_image,
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
