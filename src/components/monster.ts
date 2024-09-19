import * as rive from "@rive-app/canvas";

export class Monster{
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
  public canvasElement: HTMLCanvasElement;
  public game: any;
  public images: Object;
  public loadedImages: any;
  public imagesLoaded: boolean = false;
  public monsterPhase: number;
  public riveMonster:any;
  constructor(maincanvas) {
    this.canvasElement = document.getElementById("newcanvas") as HTMLCanvasElement;
    this.image = document.getElementById("monster") as HTMLImageElement;
  }


  initialiseRiveMonster() {
    this.riveMonster = new rive.Rive({
      src: "./assets/monsterrive.riv",
      canvas: this.canvasElement,
      autoplay: true,
      animations: 'Idle',
      stateMachines: "State Machine 1",
      layout: new rive.Layout({ fit: rive.Fit.Contain, alignment: rive.Alignment.BottomCenter }),
      onLoad: () => {
        const riveLoaded = document.getElementById("newcanvas");
        // riveLoaded.style.zIndex = '1';
        console.log("Rive Monster loaded and playing...");
      }
    });
  }

  stopRiveMonster() {
    if (this.riveMonster) {
      this.riveMonster.stop();
      const riveLoaded = document.getElementById("newcanvas");
      riveLoaded.style.zIndex = '0';
      console.log("Rive Monster animation stopped.");
    }
  }

  changeImage(src) {
    this.image.src = src;
  }
  

  changeToDragAnimation() {
    this.maxFrame=6
    this.image = this.loadedImages.dragImg;
  }

  changeToEatAnimation() {
    this.maxFrame=12
    this.image = this.loadedImages.eatImg;
  }

  changeToIdleAnimation() {
    this.maxFrame=6;
    this.image = this.loadedImages.idleImg;
  }

  changeToSpitAnimation() {
    this.maxFrame=12;
    this.image = this.loadedImages.spitImg;
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
