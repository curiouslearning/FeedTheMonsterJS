// import { loadImages } from "../common";
import { EventManager } from "../events/EventManager";
import { Rive, Layout, Fit, Alignment } from "@rive-app/canvas";

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
  public riveMonster:any;
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
    // console.log(this.image);
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrame = 6;
    this.x = this.game.width / 2 - this.game.width * 0.243;
    this.y = this.game.width / 3;
    // console.log(this.x,this.y); 
    this.fps = 10;
    this.countFrame = 0;
    this.frameInterval = 1000 / this.fps;
    this.frameTimer = 0;
    // this.images = {
    //   eatImg: "./assets/images/eat1" + this.monsterPhase + ".png",
    //   idleImg: "./assets/images/idle1" + this.monsterPhase + ".png",
    //   spitImg: "./assets/images/spit1" + this.monsterPhase + ".png",
    //   dragImg: "./assets/images/drag1" + this.monsterPhase + ".png",
    // };

    // loadImages(this.images, (images) => {
    //   this.loadedImages = Object.assign({}, images);
    //   this.changeToIdleAnimation();

    //   this.imagesLoaded = true;
    //   if (callBackFunction) {
    //     // console.log(this.imagesLoaded);
    //     callBackFunction();
    //   }
    // });
  }
  
  initialiseRiveMonster() {
    this.riveMonster = new Rive({
      src: "./assets/monsterrive.riv",
      //canvas: document.getElementById("canvas-test"),
      canvas: document.querySelector("canvas"),
      autoplay: true,
      stateMachines: "State Machine 1",
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.TopCenter }),
      onLoad: (rive) => {
        this.riveMonster.drawFrame();
        console.log('Rive animation loaded now');
        // this.riveMonster.play("Eat Happy")
      }
    })
  }

  stopRiveMonster() {
    if (this.riveMonster) {
      this.riveMonster.stop();
      // const riveLoaded = document.getElementById("newcanvas");
      // riveLoaded.style.zIndex = '0';
      console.log("Rive Monster animation stopped.");
    }
  }

  update(deltaTime) {
    // if (this.frameTimer >= this.frameInterval) {
    //   this.frameTimer = 0;
    //   if (this.frameX < this.maxFrame) {
    //     this.frameX++;
    //   } else {
    //     this.frameX = 0;
    //   }
    // } else {
    //   this.frameTimer += deltaTime;
    // }

    // this.draw();
  }

  draw() {
    // if (this.imagesLoaded) {
    //   this.context.drawImage(
    //     this.image,
    //     770 * this.frameX,
    //     1386 * this.frameY,
    //     768,
    //     1386,
    //     this.x * 0.5,
    //     this.y * 0.1,
    //     (this.width / 2) * 1.5,
    //     (this.height / 1.5) * 1.5
    //   );
    // }
  }

  changeImage(src) {
    this.image.src = src;
  }
  

  changeToDragAnimation() {
    this.maxFrame=6
    // this.image = this.loadedImages.dragImg;
    this.riveMonster.play("Opening Mouth Eat");
  }

  changeToEatAnimation() {
    this.maxFrame=12
    // this.image = this.loadedImages.eatImg;
    this.riveMonster.play("Eat Happy");
  }

  changeToIdleAnimation() {
    this.maxFrame=6;
    // this.image = this.loadedImages.idleImg;
    this.riveMonster.play("Idle");
  }

  changeToSpitAnimation() {
    this.maxFrame=12;
    // this.image = this.loadedImages.spitImg;
    this.riveMonster.play("Eat Disgust");
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

  onClick(xClick: number, yClick: number): boolean {
    const distance = Math.sqrt(
      (xClick - this.x - this.width / 4) * (xClick - this.x - this.width / 4) +
        (yClick - this.y - this.height / 2.2) *
          (yClick - this.y - this.height / 2.2)
    );
    if (distance <= 100) {
      return true;
    }
  }
}
