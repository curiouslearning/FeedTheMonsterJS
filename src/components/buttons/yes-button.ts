import { YES_BTN_IMG } from '@constants';
export default class YesButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: any; height?: number };
  public imagesLoaded: boolean = false;
  public yes_button_image: HTMLImageElement;
  private btnSize: number;
  private orignalPos: {
      x: number;
      y: number
  };

  constructor(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    posX: number,
    posY: number
  ) {
    this.posX = posX - 5;
    this.posY = posY;
    this.context = context;
    this.canvas = canvas;
    this.yes_button_image = new Image();
    this.yes_button_image.src = YES_BTN_IMG;
    this.yes_button_image.onload = (e) => {
      this.imagesLoaded = true;
      this.yes_button_image = this.yes_button_image;
    };
    this.btnSize = 0.205;
    this.orignalPos = { x: this.posX, y: this.posY };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.yes_button_image,
        this.posX,
        this.posY,
        this.canvas.width * this.btnSize,
        this.canvas.width * this.btnSize
      );

      if (this.btnSize < 0.205) {
        this.btnSize = this.btnSize + 0.0005;
      } else {
        this.posX = this.orignalPos.x;
        this.posY = this.orignalPos.y;
      }
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
      this.btnSize = 0.19;
      this.posX = this.posX + 1;
      this.posY = this.posY + 1;

      return true;
    }
  }
}
