import { isClickInsideButton, loadImages } from "@common";
import { CANCEL_BTN_IMG } from "@constants";
export default class NoButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: any; height?: number };
  public imagesLoaded: boolean = false;
  public no_button_image: HTMLImageElement;
  private btnSizeAnimation: number;
  private btnOriginalSize: number;
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
    this.posX = posX + 5;
    this.posY = posY + 10;
    this.context = context;
    this.canvas = canvas;

    loadImages({ no_button_image: CANCEL_BTN_IMG }, (images) => {
      this.no_button_image = images["no_button_image"];
      this.imagesLoaded = true;
    });

    this.btnSizeAnimation = 0.18;
    this.btnOriginalSize = this.btnSizeAnimation;
    this.orignalPos = { x: this.posX, y: this.posY };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.no_button_image,
        this.posX,
        this.posY,
        this.canvas.width * this.btnSizeAnimation,
        this.canvas.width * this.btnSizeAnimation
      );

      if (this.btnSizeAnimation < 0.18) {
        this.btnSizeAnimation = this.btnSizeAnimation + 0.0005;
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
      this.canvas.width * this.btnOriginalSize,
      this.canvas.width * this.btnOriginalSize,
      true // Button is circular
    );

    if (isInside) {
      this.btnSizeAnimation = 0.17;
      this.posX = this.posX + 1;
      this.posY = this.posY + 1;
    }

    return isInside;
  }
}