import { loadImages } from "@common";
import { CLOUD_6, CLOUD_7, CLOUD_8 } from "@constants";
import gameSettingsService from '@gameSettingsService';

export class LoadingScene {
  public canvas: HTMLCanvasElement;
  height: number;
  width: number;
  context: CanvasRenderingContext2D;
  private shouldShowLoading: boolean;
  images: any;
  loadedImages: any;
  imagesLoaded: boolean;
  cloudXPosition: number = -500;
  stopCloudMoving: boolean = false;
  cloudMovingTimeOut: number = 0;
  private unsubscribeEvent: () => void;

  constructor() {
    const { loadingCanvas, loadingContext } = gameSettingsService.getCanvasSizeValues();
    this.canvas = loadingCanvas;
    this.height = loadingCanvas.height;
    this.width = loadingCanvas.width;
    this.context = loadingContext;
    this.shouldShowLoading = false;
    this.images = {
      cloud6: CLOUD_6,
      cloud7: CLOUD_7,
      cloud8: CLOUD_8,
    };
    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.imagesLoaded = true;
    });
    this.unsubscribeEvent = gameSettingsService.subscribe(
      gameSettingsService.EVENTS.SCENE_LOADING_EVENT,
      (shouldShow: boolean) => {
        /* Note loading-scene SCENE_LOADING_EVENT has no method to unsubscribe as this is being reused throughout the entire game.*/
        this.handleLoadingScreen(shouldShow);
      }
    )
  }

  private handleLoadingScreen(shouldShow: boolean) {
    shouldShow && this.initCloud();
    this.shouldShowLoading = shouldShow;
    document.getElementById("loading").style.zIndex = shouldShow ? "10" : "-1";
  }

  draw(deltaTime: number) {
    if (!this.shouldShowLoading) return;
    this.context.clearRect(0, 0, this.width, this.height);
    this.cloudXPosition += deltaTime * 0.75;
    this.cloudMovingTimeOut += deltaTime;
    if (this.cloudMovingTimeOut>2983){
      gameSettingsService.publish(gameSettingsService.EVENTS.SCENE_LOADING_EVENT, false);
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

  private initCloud = ():void => {
    this.cloudXPosition = -500;
    this.stopCloudMoving = false;
    this.cloudMovingTimeOut = 0;
  }
}
