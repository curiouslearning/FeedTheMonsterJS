import {
  BG_IM,
  HILL_IMG,
  PILLER_IMG,
  FENCE_IMG,
  AUTUMN_BG,
  AUTUMN_HILL_IMG,
  AUTUMB_PILE_IMG,
  AUTUMN_SIGN_IMG,
  AUTUMN_FENCE_IMG,
  WINTER_BG_IMG,
  WINTER_HILL_IMG,
  WINTER_SIGN_IMG,
  WINTER_FENCE_IMG,
  WINTER_PILE_IMG,
} from "../constants";
import { loadImages } from "../common/common";
import {
  BackgroundInterface,
  BackgroundProps,
  LoadedImages,
} from "../interfaces/backgroundInterface";

const backgroundImages = {
  bgImg: BG_IM,
  hillImg: HILL_IMG,
  pillerImg: PILLER_IMG,
  fenchImg: FENCE_IMG,
  autumnBgImg: AUTUMN_BG,
  autumnHillImg: AUTUMN_HILL_IMG,
  autumnPillerImg: AUTUMB_PILE_IMG,
  autumnSignImg: AUTUMN_SIGN_IMG,
  autumnFenceImg: AUTUMN_FENCE_IMG,
  winterBgImg: WINTER_BG_IMG,
  winterHillImg: WINTER_HILL_IMG,
  winterSignImg: WINTER_SIGN_IMG,
  winterFenceImg: WINTER_FENCE_IMG,
  winterPillerImg: WINTER_PILE_IMG,
};

export class Background implements BackgroundInterface {
  public width: number;
  public height: number;
  public context: CanvasRenderingContext2D;
  public imagesLoaded: boolean = false;
  public loadedImages: LoadedImages;
  public levelNumber: number;
  public availableBackgroundTypes = ["Summer", "Autumn", "Winter"];
  public backgroundType: number;

  constructor({ context, width, height, levelNumber }: BackgroundProps) {
    this.width = width;
    this.height = height;
    this.context = context;
    this.levelNumber = levelNumber;

    this.backgroundType =
      Math.floor(this.levelNumber / 10) % this.availableBackgroundTypes.length;
    if (this.levelNumber >= 30) {
      this.backgroundType = this.backgroundType % 3;
    }

    loadImages(backgroundImages, (images) => {
      this.loadedImages = images as LoadedImages;
      this.imagesLoaded = true;
    });
  }

  draw() {
    if (this.imagesLoaded) {
      switch (this.availableBackgroundTypes[this.backgroundType]) {
        case "Winter":
          this.context.drawImage(
            this.loadedImages.winterBgImg,
            0,
            0,
            this.width,
            this.height
          );
          this.context.drawImage(
            this.loadedImages.winterPillerImg,
            this.width * 0.38,
            this.height / 6,
            this.width / 1.2,
            this.height / 2
          );
          this.context.drawImage(
            this.loadedImages.winterFenceImg,
            -this.width * 0.4,
            this.height / 4,
            this.width,
            this.height / 2
          );
          this.context.drawImage(
            this.loadedImages.winterHillImg,
            -this.width * 0.25,
            this.height / 2,
            this.width * 1.5,
            this.height / 2
          );
          break;
        case "Autumn":
          this.context.drawImage(
            this.loadedImages.autumnBgImg,
            0,
            0,
            this.width,
            this.height
          );
          this.context.drawImage(
            this.loadedImages.autumnPillerImg,
            this.width * 0.38,
            this.height / 6,
            this.width / 1.2,
            this.height / 2
          );
          this.context.drawImage(
            this.loadedImages.autumnFenceImg,
            -this.width * 0.4,
            this.height / 4,
            this.width,
            this.height / 2
          );
          this.context.drawImage(
            this.loadedImages.autumnHillImg,
            -this.width * 0.25,
            this.height / 2,
            this.width * 1.5,
            this.height / 2
          );
          break;
        default:
          this.context.drawImage(
            this.loadedImages.bgImg,
            0,
            0,
            this.width,
            this.height
          );
          this.context.drawImage(
            this.loadedImages.pillerImg,
            this.width * 0.6,
            this.height / 6,
            this.width,
            this.height / 2
          );
          this.context.drawImage(
            this.loadedImages.fenchImg,
            -this.width * 0.4,
            this.height / 3,
            this.width,
            this.height / 3
          );
          this.context.drawImage(
            this.loadedImages.hillImg,
            -this.width * 0.25,
            this.height / 2,
            this.width * 1.5,
            this.height / 2
          );
          break;
      }
    }
  }
}
