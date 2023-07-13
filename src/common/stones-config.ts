export class StoneConfig {
  public x: number;
  public y: number;
  public origx: number;
  public origy: number;
  public drawready: boolean;
  public text: string;
  public img: CanvasImageSource;

  constructor(stoneLetter, xPos, yPos) {
    this.x = xPos;
    this.y = yPos;
    this.origx = xPos;
    this.origy = yPos;
    this.drawready = false;
    this.text = stoneLetter;
    this.img = new Image();
    this.img.src = "./assets/images/stone_pink_v02.png";
  }
}
