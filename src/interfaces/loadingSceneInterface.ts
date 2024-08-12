export interface LoadingSceneInterface {
  canvas: HTMLCanvasElement;
  height: number;
  width: number;
  context: CanvasRenderingContext2D;
  images: any;
  loadedImages: any;
  imagesLoaded: boolean;
  cloudXPosition: number;
  stopCloudMoving: boolean;
  cloudMovingTimeOut: number;
  removeLoading: () => void;

  draw(deltaTime: number): void;
  initCloud(): void;
}
