import { loadImages } from "../common";
import { drawImageOnCanvas } from "@common";
import { LoadingSceneInterface } from "@interfaces/loadingSceneInterface";

export class LoadingScene implements LoadingSceneInterface {
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

  constructor(width: number, height: number, removeLoading) {
    this.canvas = document.getElementById("loading") as HTMLCanvasElement;
    this.canvas.height = height;
    this.canvas.width = width;
    this.height = height;
    this.width = width;
    this.removeLoading = removeLoading;
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
    if (this.cloudMovingTimeOut > 2983) {
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
      this.drawClouds();
    }
  }

  private drawClouds() {
    const cloudPositions = [
      {
        img: this.loadedImages.cloud6,
        x: this.cloudXPosition >= 0 ? 0 : this.cloudXPosition,
        y: this.height * 0.6,
      },
      {
        img: this.loadedImages.cloud6,
        x:
          this.cloudXPosition >= this.width * 0.4
            ? this.width * 0.4
            : this.cloudXPosition,
        y: this.height * 0.15,
      },
      {
        img: this.loadedImages.cloud7,
        x: this.cloudXPosition >= 0 ? 0 : this.cloudXPosition,
        y: this.height * 0.15,
      },
      {
        img: this.loadedImages.cloud8,
        x:
          this.cloudXPosition >= -this.width * 0.4
            ? -this.width * 0.4
            : this.cloudXPosition,
        y: -this.height * 0.15,
      },
      {
        img: this.loadedImages.cloud8,
        x:
          this.cloudXPosition >= this.width * 0.4
            ? this.width * 0.4
            : this.cloudXPosition,
        y: -this.height * 0.15,
      },
      {
        img: this.loadedImages.cloud8,
        x:
          this.cloudXPosition >= this.width * 0.05
            ? this.width * 0.05
            : this.cloudXPosition,
        y: -this.height * 0.2,
      },
      {
        img: this.loadedImages.cloud8,
        x:
          this.cloudXPosition >= -this.width * 0.6
            ? -this.width * 0.6
            : this.cloudXPosition,
        y: this.height * 0.3,
      },
      {
        img: this.loadedImages.cloud7,
        x:
          this.cloudXPosition >= this.width * 0.5
            ? this.width * 0.5
            : this.cloudXPosition,
        y: this.height * 0.4,
      },
      {
        img: this.loadedImages.cloud7,
        x:
          this.cloudXPosition >= -this.width * 0.4
            ? -this.width * 0.4
            : this.cloudXPosition,
        y: this.height * 0.7,
      },
      {
        img: this.loadedImages.cloud8,
        x:
          this.cloudXPosition >= this.width * 0.4
            ? this.width * 0.4
            : this.cloudXPosition,
        y: this.height * 0.7,
      },
      {
        img: this.loadedImages.cloud6,
        x:
          this.cloudXPosition >= -this.width * 0.2
            ? -this.width * 0.2
            : this.cloudXPosition,
        y: this.height * 0.2,
      },
    ];

    if (!this.stopCloudMoving) {
      cloudPositions.forEach((cloud) => {
        drawImageOnCanvas(
          this.context,
          cloud.img,
          cloud.x,
          cloud.y,
          this.width,
          this.height * 0.5
        );
      });
    } else {
      cloudPositions.forEach((cloud) => {
        drawImageOnCanvas(
          this.context,
          cloud.img,
          cloud.x + this.cloudXPosition,
          cloud.y,
          this.width,
          this.height * 0.5
        );
      });
    }
  }

  public initCloud = (): void => {
    this.cloudXPosition = -500;
    this.stopCloudMoving = false;
    this.cloudMovingTimeOut = 0;
  };
}
