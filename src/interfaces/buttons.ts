export type PosX = number;
export type PosY = number;
export type Context = CanvasRenderingContext2D;
export type Canvas = HTMLCanvasElement | { width: number; height?: number };
export type ImagesLoaded = boolean;
export type ButtonImage = HTMLImageElement;
export type LoadedImages = { [key: string]: HTMLImageElement };

export interface ButtonInterface {
  posX: PosX;
  posY: PosY;
  context: Context;
  canvas?: Canvas;
  imagesLoaded?: ImagesLoaded;
  button_image?: ButtonImage;
  loadedImages?: LoadedImages;
  draw?(): void;
  onClick?(xClick: number, yClick: number): boolean;
}
