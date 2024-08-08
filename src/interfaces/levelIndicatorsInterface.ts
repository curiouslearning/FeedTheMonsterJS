import { ImagesLoaded } from "./commonTypes";

export interface LevelIndicatorsProps {
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  activeIndicators: number;
}

export interface LoadedImages {
  level_indicator: HTMLImageElement;
  bar_empty: HTMLImageElement;
  bar_full: HTMLImageElement;
}

export interface LevelIndicatorsInterface {
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  activeIndicators: number;
  images: Object;
  loadedImages: LoadedImages;
  imagesLoaded: ImagesLoaded;

  setIndicators(indicatorCount: number): void;
  addDropStoneEvent(): void;
  draw(): void;
  dispose(): void;
  handleStoneDrop(event: Event): void;
  handleLoadPuzzle(event: CustomEvent): void;
}
