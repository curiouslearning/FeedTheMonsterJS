import { MAP_ICON } from "@constants";

export class LevelConfig {
  public x: number;
  public y: number;
  public index: number;
  public drawready: boolean;
  public img: CanvasImageSource;
  constructor(xPos, yPos, index) {
    this.x = xPos;
    this.y = yPos;
    this.index = index;
    this.drawready = false;
    this.img = new Image();
    this.img.src = MAP_ICON;
    this.img.onload = function(){
    }
  }
}
