import { Debugger, lang } from "../../global-variables";
import { MonsterLayer, StoreMonsterPhaseNumber } from "../common/common";
import { CanvasStack } from "../utility/canvas-stack";
var lastTime = 0;
var self;
var animationFrame;
var monsterPhaseNumber = Debugger.DebugMode
  ? localStorage.getItem(StoreMonsterPhaseNumber + lang + "Debug") || 1
  : localStorage.getItem(StoreMonsterPhaseNumber + lang) || 1;
var eatImg = new Image();
eatImg.src = "./assets/images/eat1" + monsterPhaseNumber + ".png";
var idleImg = new Image();
idleImg.src = "./assets/images/idle1" + monsterPhaseNumber + ".png";
var spitImg = new Image();
spitImg.src = "./assets/images/spit1" + monsterPhaseNumber + ".png";
var dragImg = new Image();
dragImg.src = "./assets/images/drag1" + monsterPhaseNumber + ".png";
dragImg.onload =
  function () {
    console.log("loadeded1");
  };
console.log("monsterexecuting");
export class Monster {
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
  public id: any;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public game: any;

  constructor(game, zindex?) {
    console.log(" originalcanvas ", game);
    this.game = game;
    self = this;
    this.zindex = zindex;
    this.width = this.game.width;
    this.height = this.game.height;
    this.image = document.getElementById("monster") as HTMLImageElement;
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrame = 6;
    this.x = this.game.width / 2 - this.game.width * 0.243;
    this.y = this.game.width / 3;
    this.fps = 10;
    this.countFrame = 0;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
    this.canvasStack = new CanvasStack("canvas");
    this.createCanvas();
  }

  createCanvas() {
    this.id = this.canvasStack.createLayer(
      this.height,
      this.width,
      "canvas"
    );
    this.canavsElement = document.getElementById(this.id) as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    // this.canavsElement.style.zIndex = "6";
    this.canavsElement.style.bottom = "0";
    // dragImg = new Image();
    // dragImg.src = "./assets/images/drag1" + 1 + ".png";
    // dragImg.onload = function () {
    //   console.log(" Image is loaded ");
    // }
    // this.draw();
    // this.animation(0);
  }

  changeZindex(index) {
    this.canavsElement.style.zIndex = index;
  }

  deleteCanvas() {
    cancelAnimationFrame(animationFrame);
    this.canvasStack.deleteLayer(this.id);
  }

  update(deltaTime) {
    if (this.frameTimer >= this.frameInterval) {
      // console.log(deltaTime," bb ",this.frameTimer);
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
    // this.context.clearRect(0, 0, 100, 100);
    this.context.drawImage(
      this.image,
      770 * this.frameX,
      1386 * this.frameY,
      768,
      1386,
      this.x,
      this.y * 0.8,
      this.width / 2,
      this.height / 1.5
    );
  }

  changeImage(src) {
    this.animation(0);
    // if (this.frameY == 1) {
    //   this.frameY = 0;
    // } else {
    //   this.frameY = 1;
    // }
    this.image.src = src;
  }
  changePhaseNumber(monsterPhaseNum) {
    console.log("monster changing");
    eatImg = new Image();
    eatImg.src = "./assets/images/eat1" + monsterPhaseNum + ".png";
    idleImg = new Image();
    idleImg.src = "./assets/images/idle1" + monsterPhaseNum + ".png";
    spitImg = new Image();
    spitImg.src = "./assets/images/spit1" + monsterPhaseNum + ".png";
    dragImg = new Image();
    dragImg.src = "./assets/images/drag1" + monsterPhaseNum + ".png";
    console.log(eatImg.src);
    console.log(idleImg.src);
    console.log(spitImg.src);
    console.log(monsterPhaseNumber);
  }

  changeToDragAnimation() {
    this.image = dragImg;
  }

  changeToEatAnimation() {
    this.image = eatImg;
    setTimeout(() => {
      this.changeToIdleAnimation();
    }, 2000);
  }

  changeToIdleAnimation() {
    this.image = idleImg;
  }

  changeToSpitAnimation() {
    this.image = spitImg;
    setTimeout(() => {
      this.changeToIdleAnimation();
    }, 2000);
  }
  animation(timeStamp) {
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    self.update(deltaTime);
    animationFrame = requestAnimationFrame(self.animation);
  }
}
