import { isClickInsideButton, loadImages } from "@common";
import { CANCEL_BTN_IMG } from "@constants";

export default class CancelButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: any; height?: number };
  public imagesLoaded: boolean = false;
  public cancel_button_image: HTMLImageElement;
  private btnSizeAnimation: number;
  private btnOriginalSize: number;
  private orignalPos: {
    x: number;
    y: number;
  };

  constructor(
    context: CanvasRenderingContext2D,
    canvas: { width: number; height?: number }
  ) {
    this.posX = canvas.width * 0.1 + (canvas.width * 0.15) / 2;
    this.posY = canvas.height * 0.2;
    this.context = context;
    this.canvas = canvas;

    loadImages({ cancel_button_image: CANCEL_BTN_IMG }, (images) => {
      this.cancel_button_image = images["cancel_button_image"];
      this.imagesLoaded = true;
    });

    this.btnSizeAnimation = 0.15;
    this.btnOriginalSize = this.btnSizeAnimation;
    this.orignalPos = { x: this.posX, y: this.posY };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.cancel_button_image,
        this.posX,
        this.posY,
        this.canvas.width * this.btnSizeAnimation,
        this.canvas.width * this.btnSizeAnimation
      );
      if (this.btnSizeAnimation < 0.15) {
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
      this.btnSizeAnimation = 0.14;
      this.posX = this.posX + 1;
      this.posY = this.posY + 1;
    }

    return isInside;
  }
}
