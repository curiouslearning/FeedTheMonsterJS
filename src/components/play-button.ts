import { loadImages } from "../common/common";

interface PlayButtonConfig {
  xPos: number;
  yPos: number;
  imageWidth: number;
  imageHeight: number;
}

export default class PlayButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: number; height: number };
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  private playButtonConfig: PlayButtonConfig

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
    this.setComponentConfig();
    this.images = {
      pause_button_image: "./assets/images/Play_button.png",
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
    });
  }

  private setComponentConfig = () => {
    this.playButtonConfig = {
        xPos: this.posX,
        yPos: this.posY,
        imageWidth: this.canvas.width / 3,
        imageHeight: this.canvas.width / 3
    }
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.loadedImages.pause_button_image,
        this.playButtonConfig.xPos,
        this.playButtonConfig.yPos,
        this.playButtonConfig.imageWidth,
        this.playButtonConfig.imageHeight
      );
    }
  }
  onClick(xClick: number, yClick: number): boolean {
    const distance = Math.sqrt(
      (xClick - this.posX - this.canvas.width / 6) *
        (xClick - this.posX - this.canvas.width / 6) +
        (yClick - this.posY - this.canvas.width / 6) *
          (yClick - this.posY - this.canvas.width / 6)
    );

    if (distance < this.canvas.width / 8) {
      return true;
    }
  }
}
