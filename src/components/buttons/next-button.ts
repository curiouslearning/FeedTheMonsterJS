import { isClickInsideButton, loadImages } from "@common";
import { NEXT_BUTTON } from "@constants";
export default class NextButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  public imagesLoaded: boolean = false;
  public next_button_image: HTMLImageElement;

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

    loadImages({ next_button_image: NEXT_BUTTON }, (images) => {
      this.next_button_image = images["next_button_image"];
      this.imagesLoaded = true;
    });
  }
  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.next_button_image,
        this.posX,
        this.posY,
        this.width * 0.19,
        this.width * 0.19
      );
    }
  }
  onClick(xClick: number, yClick: number): boolean {
    return isClickInsideButton(
      xClick,
      yClick,
      this.posX,
      this.posY,
      this.width * 0.19,
      this.width * 0.19
    );
  }
}
