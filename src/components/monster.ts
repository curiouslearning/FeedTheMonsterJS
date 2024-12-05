import { loadImages } from "@common";
import { EventManager } from "@events";
import { RiveMonsterComponent } from "./riveMonster/rive-monster-component";

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
  private hitboxRangeX: {
    from: number;
    to: number;
  };
  private hitboxRangeY: {
    from: number;
    to: number;
  };

  constructor(game?, monsterPhase?, callBackFunction?) {
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
    this.hitboxRangeX = {
      from: 0,
      to: 0,
    };
    this.hitboxRangeY = {
      from: 0,
      to: 0,
    };
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
      canvas: this.canvasElement,
      autoplay: true,
      fit: "contain",
      alignment: "topCenter",
      width: this.canvasElement.width, // Example width and height, adjust as needed
      height: this.canvasElement.height,
      onLoad: () => {
        this.riveMonster.play(RiveMonsterComponent.Animations.IDLE); // Start with the "Eat Happy" animation
      }
    });

    // // Listen for state change once animation completion call idle animation
    // this.riveMonster.onStateChange((stateName) => {
    //   console.log(stateName);
      
    //   if (stateName !== RiveMonsterComponent.Animations.IDLE) {
    //     this.changeToIdleAnimation(); // Return to idle after any other animation
    //   }
    // });

    //Adjust this range factor to control how big is the hit box for dropping stones.
    const rangeFactorX = 70; //SUBCTRACT FROM CENTER TO LEFT, ADD FROM CENTER TO RIGHT.
    const rangeFactorY = 50; //SUBCTRACT FROM CENTER TO TOP, ADD FROM CENTER TO BOTTOM.
    const monsterCenterX = this.game.width / 2;
    //Note: Rive height is currently always half of width. This might change when new rive files are to be implemented/
    const monsterCenterY = monsterCenterX / 2; //Create different sets of height for multiple rive files or adjust this for height when replacing the current rive monster.

    this.hitboxRangeX.from = monsterCenterX - rangeFactorX;
    this.hitboxRangeX.to = monsterCenterX + rangeFactorX;
    this.hitboxRangeY.from = monsterCenterY - rangeFactorY;
    this.hitboxRangeY.to = monsterCenterY + rangeFactorY;
  }

  checkHitboxDistance(event) {
    /*
    Note: Orginally used to check if within mouth distance. But inaccurate with the rive monster.
    Might be re-use again in the future.
    // const distance = Math.sqrt(
    //   (cursorX - this.x - this.width / 3.5) ** 2 +
    //   (cursorY - this.y - (this.width / 2) / 1.8)** 2 //Adjusted the divisor to lower the target point.
    // );
    */
    const rect = this.canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const isWithinHitboxX = x >= this.hitboxRangeX.from && x <= this.hitboxRangeX.to;
    const isWithinHitboxY = y >= this.hitboxRangeY.from && y <= this.hitboxRangeY.to;

    console.log('x y', x, y);
    console.log(isWithinHitboxX);
    console.log(isWithinHitboxY);

    return isWithinHitboxX && isWithinHitboxY;
  }

  stopRiveMonster() {
    if (this.riveMonster) {
      this.riveMonster.stop();
      console.log("Rive Monster animation stopped.");
    }
  }


  // Switch animation states for different behaviors
  changeToDragAnimation() {
    this.riveMonster.play(RiveMonsterComponent.Animations.OPENING_MOUTH_EAT);
  }

  changeToEatAnimation() {
    this.riveMonster.play(RiveMonsterComponent.Animations.EAT_HAPPY);
  }

  changeToIdleAnimation() {
    this.riveMonster.play(RiveMonsterComponent.Animations.IDLE);
  }

  changeToSpitAnimation() {
    this.riveMonster.play(RiveMonsterComponent.Animations.EAT_DISGUST);
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