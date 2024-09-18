import { isClickInsideButton, loadImages } from "@common";
import { NEXT_BTN_IMG } from "@constants";
export default class NextButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  public imagesLoaded: boolean = false;
  public next_button_image: HTMLImageElement;
  private btnSizeAnimation: number;
  private btnOriginalSize: number;
  private orignalPos: {
    x: number;
    y: number;
  };

  constructor(
    context: CanvasRenderingContext2D,
    width,
    height,
    posX: number,
    posY: number
  ) {
    this.posX = posX;
    this.posY = posY;
    this.context = context;
    this.width = width;
    this.height = height;

    loadImages({ next_button_image: NEXT_BTN_IMG }, (images) => {
      this.next_button_image = images["next_button_image"];
      this.imagesLoaded = true;
    });

    this.btnSizeAnimation = 0.19;
    this.btnOriginalSize = this.btnSizeAnimation;
    this.orignalPos = { x: this.posX, y: this.posY };
  }
  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.next_button_image,
        this.posX,
        this.posY,
        this.width * this.btnSizeAnimation,
        this.width * this.btnSizeAnimation
      );
      if (this.btnSizeAnimation < 0.19) {
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
      this.width * this.btnOriginalSize,
      this.width * this.btnOriginalSize,
      true // Button is circular
    );

    if (isInside) {
      this.btnSizeAnimation = 0.18;
      this.posX = this.posX + 1;
      this.posY = this.posY + 1;
    }

    return isInside;
  }
}
