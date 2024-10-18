import { isClickInsideButton, loadImages } from "@common";
import { PAUSE_BTN_IMG, SET_GAME_PAUSE_EVENT } from "@constants";
import gameState from '@gameState';
export default class PauseButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { height: number };
  public imagesLoaded: boolean = false;
  public pause_button_image: HTMLImageElement;
  private btnSizeAnimation: number;
  private btnOriginalSize: number;
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

    this.btnSizeAnimation = 0.09;
    this.btnOriginalSize = this.btnSizeAnimation;
    this.orignalPos = { x: this.posX, y: this.posY };
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.pause_button_image,
        this.posX,
        this.posY,
        this.canvas.height * this.btnSizeAnimation,
        this.canvas.height * this.btnSizeAnimation
      );

      if (this.btnSizeAnimation < 0.09) {
        this.btnSizeAnimation = this.btnSizeAnimation + 0.00025;
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
      this.canvas.height * this.btnOriginalSize,
      this.canvas.height * this.btnOriginalSize,
      true // Button is circular
    );

    if (isInside) {
      this.btnSizeAnimation = 0.085;
      this.posX = this.posX + 0.9;
      this.posY = this.posY + 0.9;
      gameState.publish(SET_GAME_PAUSE_EVENT, true);
    }

    return isInside;
  }
}
