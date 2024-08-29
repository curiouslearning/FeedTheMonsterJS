import { isClickInsideButton, loadImages } from "@common";
import { CLOSE_BUTTON } from "@constants";

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

    loadImages({ close_button_image: CLOSE_BUTTON }, (images) => {
      this.close_button_image = images["close_button_image"];
      this.imagesLoaded = true;
    });
  }
  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
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
      this.canvas.width * 0.19,
      this.canvas.width * 0.19
    );
  }
}
