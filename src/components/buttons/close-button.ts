import { drawImageOnCanvas, isClickInsideButton, loadImages } from "@common";
import { ButtonInterface } from "@interfaces/buttons";

export default class CloseButton implements ButtonInterface {
  posX: number;
  posY: number;
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  imagesLoaded: boolean = false;
  button_image: HTMLImageElement;

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

    loadImages({ button_image: "./assets/images/map_btn.png" }, (images) => {
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
      this.canvas.width * 0.19,
      this.canvas.width * 0.19
    );
  }
}
