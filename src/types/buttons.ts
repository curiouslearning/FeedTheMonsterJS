export type PosX = number;
export type PosY = number;
export type Context = CanvasRenderingContext2D;
export type Canvas = HTMLCanvasElement | { width: number; height?: number };
export type ImagesLoaded = boolean;
export type CloseButtonImage = HTMLImageElement;
export type ButtonImage = HTMLImageElement;

export interface ButtonInterface {
  posX: number;
  posY: number;
  context: Context;
  canvas: Canvas;
  imagesLoaded: ImagesLoaded;
  button_image: ButtonImage;
  draw(): void;
  onClick(xClick: number, yClick: number): boolean;
}
