export interface BackgroundProps {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  levelNumber: number;
}

export interface LoadedImages {
  bgImg: HTMLImageElement;
  hillImg: HTMLImageElement;
  pillerImg: HTMLImageElement;
  fenchImg: HTMLImageElement;
  autumnBgImg: HTMLImageElement;
  autumnHillImg: HTMLImageElement;
  autumnPillerImg: HTMLImageElement;
  autumnSignImg: HTMLImageElement;
  autumnFenceImg: HTMLImageElement;
  winterBgImg: HTMLImageElement;
  winterHillImg: HTMLImageElement;
  winterSignImg: HTMLImageElement;
  winterFenceImg: HTMLImageElement;
  winterPillerImg: HTMLImageElement;
}

export interface BackgroundInterface {
  width: number;
  height: number;
  context: CanvasRenderingContext2D;
  imagesLoaded: boolean;
  loadedImages: LoadedImages;
  levelNumber: number;
  availableBackgroundTypes: string[];
  backgroundType: number;

  draw(): void;
}
