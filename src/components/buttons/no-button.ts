import { NO_BUTTON } from "@constants";

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

    this.no_button_image = new Image();
    this.no_button_image.src = NO_BUTTON;
    this.no_button_image.onload = (e) => {
      this.imagesLoaded = true;
      this.no_button_image = this.no_button_image;
    };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.no_button_image,
        this.posX + 5,
        this.posY + 10,
        this.canvas.width * 0.18,
        this.canvas.width * 0.18
      );
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    const distance = Math.sqrt(
      (xClick - this.posX - (this.canvas.width * 0.15) / 2) *
        (xClick - this.posX - (this.canvas.width * 0.15) / 2) +
        (yClick - this.posY - (this.canvas.width * 0.15) / 2) *
          (yClick - this.posY - (this.canvas.width * 0.15) / 2)
    );
    if (distance < (this.canvas.width * 0.15) / 2) {
      return true;
    }
  }
}
