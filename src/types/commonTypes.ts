export interface ImagePaths {
  bgImg: string;
  hillImg: string;
  pillerImg: string;
  fenchImg: string;
  autumnBgImg: string;
  autumnHillImg: string;
  autumnPillerImg: string;
  autumnSignImg: string;
  autumnFenceImg: string;
  winterBgImg: string;
  winterHillImg: string;
  winterSignImg: string;
  winterFenceImg: string;
  winterPillerImg: string;
}

export type LoadedImages = Record<keyof ImagePaths, HTMLImageElement>;

export interface BackgroundProps {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  levelNumber: number;
}
