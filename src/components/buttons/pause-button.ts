import { isClickInsideButton, loadImages } from "@common";
import { PAUSE_BTN_IMG } from "@constants";
export default class PauseButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { height: number };
  public imagesLoaded: boolean = false;
  public pause_button_image: HTMLImageElement;
  private btnSize: number;
  private orignalPos: {
    x: number;
    y: number;
  };

  constructor(
    context: CanvasRenderingContext2D,
    canvas: { width?: number; height: number }
  ) {
    this.posX = canvas.width - canvas.height * 0.09;
    this.posY = 0;
    this.context = context;
    this.canvas = canvas;

    loadImages({ pause_button_image: PAUSE_BTN_IMG }, (images) => {
      this.pause_button_image = images["pause_button_image"];
      this.imagesLoaded = true;
    });

    this.btnSize = 0.09;
    this.orignalPos = { x: this.posX, y: this.posY };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.pause_button_image,
        this.posX,
        this.posY,
        this.canvas.height * this.btnSize,
        this.canvas.height * this.btnSize
      );

      if (this.btnSize < 0.09) {
        this.btnSize = this.btnSize + 0.0005;
      } else {
        this.posX = this.orignalPos.x;
        this.posY = this.orignalPos.y;
      }
    }
  }

  onClick(xClick: number, yClick: number): boolean {
    const isInside = isClickInsideButton(
      xClick,
      yClick,
      this.posX,
      this.posY,
      this.canvas.height * this.btnSize,
      this.canvas.height * this.btnSize,
      true // Button is circular
    );

    if (isInside) {
      this.btnSize = 0.08;
      this.posX = this.posX + 1;
      this.posY = this.posY + 1;

      return true;
    }
    return false;
  }
}
