import { drawImageOnCanvas, isClickInsideButton, loadImages } from "@common";
import { ButtonInterface } from "@interfaces/buttons";

export default class CancelButton implements ButtonInterface {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: any; height?: number };
  public imagesLoaded: boolean = false;
  public button_image: HTMLImageElement;

  constructor(
    context: CanvasRenderingContext2D,
    canvas: { width: number; height?: number }
  ) {
    this.posX = canvas.width * 0.1 + (canvas.width * 0.15) / 2;
    this.posY = canvas.height * 0.2;
    this.context = context;
    this.canvas = canvas;

    loadImages({ button_image: "./assets/images/close_btn.png" }, (images) => {
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
        this.canvas.width * 0.15,
        this.canvas.width * 0.15
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    console.log("cancel button clicked");
    return isClickInsideButton(
      xClick,
      yClick,
      this.posX,
      this.posY,
      this.canvas.width * 0.15,
      this.canvas.width * 0.15
    );
  }
}
