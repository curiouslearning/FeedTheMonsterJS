import { Debugger, lang } from "../../global-variables";
import {
  StoreMonsterPhaseNumber,
  loadImages,
} from "../common/common";

import { EventManager } from "../events/EventManager";

interface MonsterConfigs {
  xPos: number;
  yPos: number;
  imageWidth: number;
  imageHeight: number;
}

export class Monster extends EventManager {
  public zindex: number;
  public width: number;
  public height: number;
  public image: HTMLImageElement;
  public frameX: number;
  public frameY: number;
  public maxFrame: number;
  public x: number;
  public y: number;
  public fps: number;
  public countFrame: number;
  public frameInterval: number;
  public frameTimer: number;
  public canvasStack: any;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public game: any;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public monsterPhase: number;
  private monsterConfig: MonsterConfigs
  private animationIndex: number = 0;

  constructor(game, monsterPhase, callBackFunction?) {
    super({
      stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
      loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event),
    });
    this.game = game;
    this.monsterPhase = monsterPhase;
    this.width = this.game.width;
    this.height = this.game.height;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    this.image = document.getElementById("monster") as HTMLImageElement;

    this.frameX = 0;
    this.frameY = 0;
    this.maxFrame = 6;
    this.x = this.game.width / 2 - this.game.width * 0.243;
    this.y = this.game.width / 3;
    this.setComponentConfig();
    this.fps = 10;
    this.countFrame = 0;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;

    this.images = {
      idleImg: "./assets/images/monster_01.png",
      // eatImg: "./assets/images/eat1" + this.monsterPhase + ".png",
      // idleImg: "./assets/images/idle1" + this.monsterPhase + ".png",
      // spitImg: "./assets/images/spit1" + this.monsterPhase + ".png",
      // dragImg: "./assets/images/drag1" + this.monsterPhase + ".png",
    };

    loadImages(this.images, (images) => {
      this.loadedImages = Object.assign({}, images);
      this.changeToIdleAnimation();

      this.imagesLoaded = true;
      if (callBackFunction) {
        console.log(this.imagesLoaded);
        callBackFunction();
      }
    });
  }


  private setComponentConfig = () => {
    this.monsterConfig = {
      xPos: 0,
      yPos: 0,
      imageWidth: this.width,
      imageHeight: this.height
    }
  }
  update(deltaTime) {
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
    } else {
      this.frameTimer += deltaTime;
    }

    this.draw();
  }

  draw() {
    if (this.imagesLoaded) {
      this.context.drawImage(
        this.image,
        (770)* this.frameX,
        (1371*this.animationIndex),
        768,
        1371,
        this.monsterConfig.xPos,
        this.monsterConfig.yPos,
        this.monsterConfig.imageWidth,
        this.monsterConfig.imageHeight
      );
    }
  }

  changeImage(src) {
    this.image.src = src;
  }
  

  changeToDragAnimation() {
    // this.image = this.loadedImages.dragImg;
    this.animationIndex = 1;
  }

  changeToEatAnimation() {
    // this.image = this.loadedImages.eatImg;
    this.animationIndex = 2;
  }

  changeToIdleAnimation() {
    this.image = this.loadedImages.idleImg;
       this.animationIndex = 0;
  }

  changeToSpitAnimation() {
    // this.image = this.loadedImages.spitImg;
    this.animationIndex = 3;
  }

  public handleStoneDrop(event) {
    if (event.detail.isCorrect) {
      this.changeToEatAnimation();
    } else {
      this.changeToSpitAnimation();
    }
  }
  public handleLoadPuzzle(event) {
    this.changeToIdleAnimation();
  }

  public dispose() {
    this.unregisterEventListener();
  }

  isPointInsideOval(x, y) {
    const center = { x: (this.width/1.96), y: this.height/1.5 };
    const majorAxisPoints = [{ x: (this.width/1.995), y: (this.height/1.777) }, { x: (this.width/1.995), y: (this.height/1.302) }];
    const minorAxisPoints = [{ x: (this.width/2.79), y: (this.height/1.466) }, { x: (this.width/1.513), y: (this.height/1.466) }];
  
    const a = Math.abs(majorAxisPoints[0].y - majorAxisPoints[1].y) / 2;
    const b = Math.abs(minorAxisPoints[0].x - minorAxisPoints[1].x) / 2;
  
    const ellipseEquation = ((x - center.x) ** 2) / (a ** 2) + ((y - center.y) ** 2) / (b ** 2);
    return ellipseEquation <= 1;
  }

  onClick(xClick: number, yClick: number): boolean {
    if (this.isPointInsideOval(xClick, yClick)) {
      return true;
    } else {
      return false;
    }
  }
}
