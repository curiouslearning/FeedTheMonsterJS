import {
  drawImageOnCanvas,
  isClickInsideButton,
  loadImages,
} from "../../common/utils";

export default class NoButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: any; height?: number };
  public imagesLoaded: boolean = false;
  public no_button_image: HTMLImageElement;

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
      { no_button_image: "./assets/images/close_btn.png" },
      (images) => {
        this.no_button_image = images["no_button_image"];
        this.imagesLoaded = true;
      }
    );
  }

  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.no_button_image,
        this.posX + 5,
        this.posY + 10,
        this.canvas.width * 0.18,
        this.canvas.width * 0.18
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
