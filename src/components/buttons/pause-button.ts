import {
  drawImageOnCanvas,
  isClickInsideButton,
  loadImages,
} from "../../common/utils";

export default class PauseButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { height: number };
  public imagesLoaded: boolean = false;
  public pause_button_image: HTMLImageElement;

  constructor(
    context: CanvasRenderingContext2D,
    canvas: { width?: number; height: number }
  ) {
    this.posX = canvas.width - canvas.height * 0.09;
    this.posY = 0;
    this.context = context;
    this.canvas = canvas;

    loadImages(
      { pause_button_image: "./assets/images/pause_v01.png" },
      (images) => {
        this.pause_button_image = images["pause_button_image"];
        this.imagesLoaded = true;
      }
    );
  }
  draw() {
    if (this.imagesLoaded) {
      drawImageOnCanvas(
        this.context,
        this.pause_button_image,
        this.posX,
        this.posY,
        this.canvas.height * 0.09,
        this.canvas.height * 0.09
      );
    }
  }
  onClick(xClick: number, yClick: number): boolean {
    return isClickInsideButton(
      xClick,
      yClick,
      this.posX,
      this.posY,
      this.canvas.height * 0.09
    );
  }
}
