export interface MonsterInterface {
  zindex: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  frameX: number;
  frameY: number;
  maxFrame: number;
  x: number;
  y: number;
  fps: number;
  countFrame: number;
  frameInterval: number;
  frameTimer: number;
  canvasStack: any;
  canavsElement: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  game: any;
  images: { [key: string]: string };
  loadedImages: { [key: string]: HTMLImageElement };
  imagesLoaded: boolean;
  monsterPhase: number;

  update(deltaTime: number): void;
  draw(): void;
  changeImage(src: string): void;
  changeToDragAnimation(): void;
  changeToEatAnimation(): void;
  changeToIdleAnimation(): void;
  changeToSpitAnimation(): void;
  handleStoneDrop(event: Event): void;
  handleLoadPuzzle(event: Event): void;
  dispose(): void;
  onClick(xClick: number, yClick: number): boolean;
}
