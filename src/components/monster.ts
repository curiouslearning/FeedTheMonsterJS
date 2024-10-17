import { loadImages } from "@common";
import { EventManager } from "@events";
import { RiveMonsterComponent } from "./riveMonster";

export class Monster extends EventManager {
  public zindex: number;
  public width: number;
  public height: number;
  public x: number;
  public y: number;
  public fps: number;
  public canvasStack: any;
  public canvasElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public game: any;
  public monsterPhase: number;
  public riveMonster: RiveMonsterComponent; // Now using the RiveMonsterComponent

  constructor(game, monsterPhase, callBackFunction?) {
    super({
      stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
      loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event),
    });
    this.game = game;
    this.monsterPhase = monsterPhase;
    this.width = this.game.width;
    this.height = this.game.height;
    this.canvasElement = document.getElementById("rivecanvas") as HTMLCanvasElement;
    this.context = this.canvasElement.getContext("2d");
    this.x = this.game.width / 2 - this.game.width * 0.243;
    this.y = this.game.width / 3;
    this.fps = 10;

    // Initialize Rive Monster
    this.initializeRiveMonster();

    // Call callback if provided after initialization
    if (callBackFunction) {
      callBackFunction();
    }
  }

  initializeRiveMonster() {
   // Initialize the RiveMonsterComponent instead of directly using Rive
   this.riveMonster = new RiveMonsterComponent({
    src: "./assets/monsterrive.riv",
    canvas: this.canvasElement,
    autoplay: true,
    stateMachines: "State Machine 1",
    fit: "contain",
    alignment: "topCenter",
    width: this.canvasElement.width, // Example width and height, adjust as needed
    height: this.canvasElement.height,
    onLoad: () => {
      this.riveMonster.play("Eat Happy"); // Start with the "Idle" animation
    }
  });
  }

  stopRiveMonster() {
    if (this.riveMonster) {
      this.riveMonster.stop();
      console.log("Rive Monster animation stopped.");
    }
  }

  // Update function (if needed for custom logic)
  update(deltaTime?) {
    // Custom update logic here
  }

  // Drawing is now handled by Rive automatically, no need for custom draw logic
  draw() {
    console.log('Drawing Rive Animation');
    // Rive takes care of the rendering, no manual draw call needed
  }

  // Switch animation states for different behaviors
  changeToDragAnimation() {
    this.riveMonster.play("Opening Mouth Eat");
  }

  changeToEatAnimation() {
    this.riveMonster.play("Eat Happy");
  }

  changeToIdleAnimation() {
    this.riveMonster.play("Idle");
  }

  changeToSpitAnimation() {
    this.riveMonster.play("Eat Disgust");
  }

  // Event handlers for puzzle and stone drop
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

  // Cleanup
  public dispose() {
    this.stopRiveMonster();
    this.unregisterEventListener();
  }

  // Example click handler
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