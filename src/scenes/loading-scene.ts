import { loadImages } from "../common";
export class LoadingScene {
  public canvas: HTMLCanvasElement;
  height: number;
  width: number;
  context: CanvasRenderingContext2D;
  images: any;
  loadedImages: any;
  imagesLoaded: boolean;
  cloudXPosition: number = -500;
  stopCloudMoving: boolean = false;
  cloudMovingTimeOut: number = 0;
  public removeLoading;
  constructor(width: number, height: number,removeLoading) {
    this.canvas = document.getElementById("loading") as HTMLCanvasElement;
    this.canvas.height = height;
    this.canvas.width = width;
    this.height = height;
    this.width = width;
    this.removeLoading=removeLoading;
    this.context = this.canvas.getContext("2d");
    this.images = {
      cloud6: "./assets/images/cloud_01.png",
      cloud7: "./assets/images/cloud_02.png",
      cloud8: "./assets/images/cloud_03.png",
    };
    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
    });
  }
  draw(deltaTime: number) {
    this.context.clearRect(0, 0, this.width, this.height);
    this.cloudXPosition += deltaTime * 0.75;
    this.cloudMovingTimeOut += deltaTime;
    if(this.cloudMovingTimeOut>2983){
      this.removeLoading();
    }
    if (this.cloudXPosition >= this.width * 0.5 && !this.stopCloudMoving) {
      this.cloudMovingTimeOut += deltaTime;
      if (this.cloudMovingTimeOut > 2000) {
        this.stopCloudMoving = true;
        this.cloudXPosition = 0;
      }
    }
    if (this.imagesLoaded) {
      if (!this.stopCloudMoving) {
        this.context.drawImage(
          this.loadedImages.cloud6,
          this.cloudXPosition >= 0 ? 0 : this.cloudXPosition,
          this.height * 0.6,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud6,
          this.cloudXPosition >= this.width * 0.4
            ? this.width * 0.4
            : this.cloudXPosition,
          this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud7,
          this.cloudXPosition >= 0 ? 0 : this.cloudXPosition,
          this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.cloudXPosition >= -this.width * 0.4
            ? -this.width * 0.4
            : this.cloudXPosition,
          -this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.cloudXPosition >= this.width * 0.4
            ? this.width * 0.4
            : this.cloudXPosition,
          -this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.cloudXPosition >= this.width * 0.05
            ? this.width * 0.05
            : this.cloudXPosition,
          -this.height * 0.2,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.cloudXPosition >= -this.width * 0.6
            ? -this.width * 0.6
            : this.cloudXPosition,
          this.height * 0.3,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud7,
          this.cloudXPosition >= this.width * 0.5
            ? this.width * 0.5
            : this.cloudXPosition,
          this.height * 0.4,
          this.width,
          this.height * 0.4
        );
        this.context.drawImage(
          this.loadedImages.cloud7,
          this.cloudXPosition >= -this.width * 0.4
            ? -this.width * 0.4
            : this.cloudXPosition,
          this.height * 0.7,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.cloudXPosition >= this.width * 0.4
            ? this.width * 0.4
            : this.cloudXPosition,
          this.height * 0.7,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud6,
          this.cloudXPosition >= -this.width * 0.2
            ? -this.width * 0.2
            : this.cloudXPosition,
          this.height * 0.2,
          this.width,
          this.height * 0.5
        );
      } else {
        this.context.drawImage(
          this.loadedImages.cloud6,
          0 + this.cloudXPosition,
          this.height * 0.6,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud6,
          this.width * 0.4 + this.cloudXPosition,
          this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud7,
          0 + this.cloudXPosition,
          this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          -this.width * 0.4 + this.cloudXPosition,
          -this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.width * 0.4 + this.cloudXPosition,
          -this.height * 0.15,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.width * 0.05 + this.cloudXPosition,
          -this.height * 0.2,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          -this.width * 0.6 + this.cloudXPosition,
          this.height * 0.3,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud7,
          this.width * 0.5 + this.cloudXPosition,
          this.height * 0.4,
          this.width,
          this.height * 0.4
        );
        this.context.drawImage(
          this.loadedImages.cloud7,
          -this.width * 0.4 + this.cloudXPosition,
          this.height * 0.7,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud8,
          this.width * 0.4 + this.cloudXPosition,
          this.height * 0.7,
          this.width,
          this.height * 0.5
        );
        this.context.drawImage(
          this.loadedImages.cloud6,
          -this.width * 0.2 + this.cloudXPosition,
          this.height * 0.2,
          this.width,
          this.height * 0.5
        );
      }
    }
  }

  public initCloud = ():void => {
    this.cloudXPosition = -500;
    this.stopCloudMoving = false;
    this.cloudMovingTimeOut = 0;
  }
}
