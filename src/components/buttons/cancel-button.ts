import { isClickInsideButton, loadImages } from "@common";
import { CANCEL_BUTTON } from "@constants";

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

    loadImages({ cancel_button_image: CANCEL_BUTTON }, (images) => {
      this.cancel_button_image = images["cancel_button_image"];
      this.imagesLoaded = true;
    });
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
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
      this.canvas.width * 0.15,
      this.canvas.width * 0.15
    );
  }
}
