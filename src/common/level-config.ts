import { MAP_ICON_IMG } from "@constants";

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
    this.img.src = MAP_ICON_IMG;
    this.img.onload = function(){
      // console.log("mapIcon loadededed");
    }
  }
}
