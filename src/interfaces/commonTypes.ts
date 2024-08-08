import { ImagePaths } from "./IImagePaths";

export type PosX = number;
export type PosY = number;
export type Context = CanvasRenderingContext2D;
export type Canvas = HTMLCanvasElement | { width: number; height?: number };
export type ImagesLoaded = boolean;
export type ButtonImage = HTMLImageElement;

export type LoadedImages = Record<keyof ImagePaths, HTMLImageElement>;

export interface BackgroundProps {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  levelNumber: number;
}
