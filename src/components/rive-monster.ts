import * as rive from "@rive-app/canvas";

export class RiveMonster{
  public zindex: number;
  public width: number;
  public height: number;
  public frameX: number;
  public frameY: number;
  public maxFrame: number;
  public x: number;
  public y: number;
  public fps: number;
  public countFrame: number;
  public frameInterval: number;
  public frameTimer: number;
  public monsterContext: CanvasRenderingContext2D;
  public canvasElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public images: Object;
  public loadedImages: any;
  public monsterPhase: number;

  constructor() {
    this.canvasElement = document.getElementById("newcanvas") as HTMLCanvasElement;
  }

  update() {
    this.draw();
  }

  draw() {
    this.initialiseRiveMonster();
  }

  initialiseRiveMonster(){
    // console.log("called rive monster");
    
      // const r =  new rive.Rive({
      //   src: "./assets/monster-rive.riv", // host your Rive file and add the url to src 
      //   canvas:this.canvasElement,
      //   autoplay: true,
      // })

      const r = new rive.Rive({
        src: "./assets/chimple",
        // OR the path to a discoverable and public Rive asset
        // src: '/public/example.riv',
        canvas: this.canvasElement,
        autoplay: true,
        animations:'idle_1',
        stateMachines: "bumpy",
        // onLoad: () => {
        //   r.resizeDrawingSurfaceToCanvas();
        // },
      });
       // Update the layout
      // Constrain the Rive content to (minX, minY), (maxX, maxY) in the canvas
      r.layout = new rive.Layout({
        fit: rive.Fit.Cover,
        // minX: 50,
        // minY: 50,
        // maxX: 100,
        // maxY: 100,
      });
      let boolCheck = false;
      const buttonEl = document.getElementById("newcanvas");
      buttonEl.onclick = function() {
        
        boolCheck= !boolCheck;
        console.log(boolCheck ? "bumped" : "stopped bumping");
        // Play the 'bumpy' state machine
        boolCheck ? r.play("bumpy") : r.pause("bumpy");
        
      };

  }


  public dispose() {
    // this.unregisterEventListener();
  }

}
