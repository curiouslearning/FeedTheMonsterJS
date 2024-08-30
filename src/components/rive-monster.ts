import * as rive from "@rive-app/canvas";

export class RiveMonster {
  public canvasElement: HTMLCanvasElement;
  public monsterContext: CanvasRenderingContext2D;
  public maincanvas:any;
  public riveMonster:any;
  constructor(maincanvas) {
    this.canvasElement = document.getElementById("newcanvas") as HTMLCanvasElement;
    this.monsterContext = this.canvasElement.getContext('2d');
    this.maincanvas = maincanvas;
    // Set the canvas size to match the Rive animation size
    // this.width = this.canvasElement.width; // Set width of canvas
    // this.height = this.canvasElement.height; // Set height of canvas
    this.canvasElement.width = 160;
    this.canvasElement.height = 190;
  }

  initialiseRiveMonster() {
    this.riveMonster = new rive.Rive({
      src: "./assets/monsterrive.riv",
      canvas: this.canvasElement,
      autoplay: true,
      animations: 'Idle',
      stateMachines: "State Machine 1",
      layout: new rive.Layout({ fit: rive.Fit.FitHeight, alignment: rive.Alignment.Center }),
      onLoad: () => {
        const riveLoaded = document.getElementById("newcanvas");
        riveLoaded.style.zIndex = '1';
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
}
