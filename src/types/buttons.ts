export type PosX = number;
export type PosY = number;
export type Context = CanvasRenderingContext2D;
export type Canvas = HTMLCanvasElement;
export type ImagesLoaded = boolean;
export type CloseButtonImage = HTMLImageElement;

export type CloseButtonType = {
  posX: PosX;
  posY: PosY;
  context: Context;
  canvas: Canvas;
  imagesLoaded: ImagesLoaded;
};
