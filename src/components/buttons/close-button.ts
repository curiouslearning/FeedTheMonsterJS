import { isClickInsideButton, loadImages } from "@common";
import { MAP_BTN_IMG } from "@constants";

export default class CloseButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;
  public imagesLoaded: boolean = false;
  public close_button_image: HTMLImageElement;
  private btnSize: number;
  private orignalPos: {
    x: number;
    y: number;
  };

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

    loadImages({ close_button_image: MAP_BTN_IMG }, (images) => {
      this.close_button_image = images["close_button_image"];
      this.imagesLoaded = true;
    });

    this.btnSize = 0.19;
    this.orignalPos = { x: posX, y: posY };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.close_button_image,
        this.posX,
        this.posY,
        this.canvas.width * this.btnSize,
        this.canvas.width * this.btnSize
      );

      if (this.btnSize < 0.19) {
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
      this.canvas.width * this.btnSize,
      this.canvas.width * this.btnSize,
      true // Button is circular
    );

    if (isInside) {
      this.btnSize = 0.18;
      this.posX = this.posX + 1;
      this.posY = this.posY + 1;

      return true;
    }
    return false;
  }
}
