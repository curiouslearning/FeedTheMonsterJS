import { Debugger, lang } from "../../global-variables.js";
import { StoreMonsterPhaseNumber } from "../common/common.js";
import { LevelStartScene } from "./level-start-scene.js";

var animationFrame: number;
var self: any;
export class Game {
  public width: number;
  public height: number;
  public scene: LevelStartScene;
  public gameSceneCallBack: any;
  public monsterPhaseNumber: any;
  public feedBackTexts: any;
  public rightToLeft:boolean

  constructor(
    width: number,
    height: number,
    puzzleData: any,
    gameSceneCallBack: any,
    feedBackTexts: any,
    rightToLeft:boolean
  ) {
    this.width = width;
    this.height = height;
    this.monsterPhaseNumber = Debugger.DebugMode
      ? localStorage.getItem(StoreMonsterPhaseNumber + lang+"Debug") || 1
      : localStorage.getItem(StoreMonsterPhaseNumber + lang) || 1;
    this.scene = new LevelStartScene({
      game: this,
      levelData: puzzleData,
      levelStartCallBack: this.levelStartCallBack,
      monsterPhaseNumber: this.monsterPhaseNumber,
      feedBackTexts: feedBackTexts,
      rightToLeft:rightToLeft
    });
    this.gameSceneCallBack = gameSceneCallBack;
    this.render();
    self = this;
    this.animation();
  }
  levelStartCallBack(button_name) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
    switch (button_name) {
      case "close_button": {
        self.gameSceneCallBack(button_name);
        break;
      }
      case "next_button": {
        self.gameSceneCallBack(button_name);
        break;
      }
      case "retry_button": {
        self.gameSceneCallBack(button_name);
        break;
      }
    }
  }
  update() {
    self.scene ? (self.scene.stones ? self.scene.stones.update() : null) : null;
    self.scene ? self.scene.update() : null;
  }

  render() {
    cancelAnimationFrame(animationFrame);
    this.scene.createBackgroud();
  }
  animation() {
    self.update();
    animationFrame = requestAnimationFrame(self.animation);
  }
}
