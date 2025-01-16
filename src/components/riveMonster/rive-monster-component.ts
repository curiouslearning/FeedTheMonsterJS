import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';
import { SceneHandler } from '@sceneHandler/scene-handler';

interface RiveMonsterComponentProps {
  canvas: HTMLCanvasElement; // Canvas element where the animation will render
  autoplay: boolean;
  fit?: string; // Fit property (e.g contain, cover, etc.)
  alignment?: string; // Alignment property (e.g topCenter, bottomLeft, etc.)
  width?: number; // Optional width for the Rive animation
  height?: number; // Optional height for the Rive animation
  onLoad?: () => void; // Callback once Rive animation is loaded
  gameCanvas?: HTMLCanvasElement; // Main canvas element
}

export class RiveMonsterComponent {
  private props: RiveMonsterComponentProps;
  private riveInstance: any;
  private src: string = '/assets/monsterrive.riv';  // Define the .riv file path eggMonsterfinal
  private stateMachineName: string = "State Machine 1"  // Define the state machine
  public game: any;
  public x: number;
  public y: number;
  private hitboxRangeX: {
    from: number;
    to: number;
  };
  private hitboxRangeY: {
    from: number;
    to: number;
  };

  private sceneHandler: any; // Assume sceneHandler will give us the monster phase
  private currentPhase: number = 1;  // Default phase, can be dynamically set
  // Static readonly properties for all monster animations
  public static readonly Animations = {
    //new animation
    IDLE: "Idle",
    SAD: "Sad",
    STOMP: "Stomp",
    STOMPHAPPY: "StompHappy",
    SPIT: "Spit",
    CHEW: "Chew",
    MOUTHOPEN: "MouthOpen",
    MOUTHCLOSED: "MouthClosed",
    HAPPY: "Happy",
  };

  constructor(props: RiveMonsterComponentProps) {
    this.props = props;
    this.sceneHandler = SceneHandler;  // Assuming sceneHandler is passed in here
    this.moveCanvasUpOrDown(50); // Move down by 50px
    const monsterCenterX = props.canvas.width / 2;
    const monsterCenterY = props.canvas.height / 2;
    const rangeFactorX = 55;
    const rangeFactorY = 100;

    this.hitboxRangeX = {
      from: monsterCenterX - rangeFactorX,
      to: monsterCenterX + rangeFactorX,
    };
    this.hitboxRangeY = {
      from: monsterCenterY + (rangeFactorY / 2),
      to: monsterCenterY + (rangeFactorY * 2),
    };
    // this.getMonsterPhase();
    this.initializeRive();
  }

  // Dynamically gets the monster phase from the scene handler
  public getMonsterPhase(): number {
    // Dynamically fetch the current monster phase from the sceneHandler
    this.currentPhase = this.sceneHandler.getMonsterPhase(); // Assuming this method returns the current phase
    console.log("Monster Phase :", this.currentPhase);

    return this.currentPhase;  // Return the current monster phase
  }

  public updateSrcByPhase(phase: number) {
    const newSrc = RiveMonsterComponent.getSrcForMonsterPhase(phase);

    // Check if the source has actually changed
    if (this.src !== newSrc) {
      console.log(`Switching .riv file from ${this.src} to ${newSrc}`);
      this.src = newSrc; // Update the source

      // Dispose of the current instance to avoid memory leaks
      if (this.riveInstance) {
        this.dispose();
      }

      // Reinitialize the Rive instance with the new source
      this.initializeRive();
    } else {
      console.log('Phase is the same, no need to switch .riv file.');
    }
  }

  public static getSrcForMonsterPhase(phase: number): string {
    const srcMapping = {
      1: '/assets/finalEggMonster.riv',
      2: '/assets/monsterrive.riv',
    };

    return srcMapping[phase] || '/assets/monsterrive.riv';
  }

  private initializeRive() {
    this.riveInstance = new Rive({
      src: this.src,
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      stateMachines: [this.stateMachineName],
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      onLoad: this.handleLoad.bind(this),
    });
  }

  getInputs() {
    return this.riveInstance.stateMachineInputs(this.stateMachineName);
  }

  public moveCanvasUpOrDown(offsetY: number) {
    const canvas = this.props.canvas;
    const currentTop = parseFloat(window.getComputedStyle(canvas).top) || 0;
    if (currentTop === 0) {
      // Set the new top value based on the offset
      const newTop = currentTop + offsetY;

      // Apply the new position
      canvas.style.top = `${newTop}px`;
      canvas.style.position = 'absolute';
      canvas.style.zIndex = '5';         // Set z-index to a high value to bring it on top
    }
  }

  private handleLoad() {
    const inputs = this.getInputs();
    const requiredTriggers = [
      'backToIdle', 'isStomped', 'isMouthOpen', 'isMouthClosed',
      'isChewing', 'isHappy', 'isSpit', 'isSad',
    ];

    const missingTriggers = requiredTriggers.filter(
      (name) => !inputs.some((input) => input.name === name)
    );

    if (missingTriggers.length) {
      console.error(`Missing state machine inputs: ${missingTriggers.join(', ')}`);
    }

    if (this.props.onLoad) this.props.onLoad();
  }

  public triggerInput(inputName: string) {
    const stateMachineInput = this.getInputs().find(input => input.name === inputName);
    if (stateMachineInput) {
      stateMachineInput.fire(); // Trigger input
    } else {
      console.warn(`Input ${inputName} not found.`);
    }
  }

  play(animationName: string) {
    this.riveInstance?.play(animationName);
  }


  stop() {
    this.riveInstance?.stop();
  }

  checkHitboxDistance(event) {
    const rect = this.props.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const isWithinHitboxX =
      x >= this.hitboxRangeX.from && x <= this.hitboxRangeX.to;
    const isWithinHitboxY =
      y >= this.hitboxRangeY.from && y <= this.hitboxRangeY.to;

    return isWithinHitboxX && isWithinHitboxY;
  }

  // Example click handler
  onClick(xClick: number, yClick: number): boolean {
    const centerX = this.x + this.props.canvas.width / 4;
    const centerY = this.y + this.props.canvas.height / 2.2;

    const distance = Math.sqrt(
      (xClick - centerX) * (xClick - centerX) +
      (yClick - centerY) * (yClick - centerY),
    );

    return distance <= 100; // Explicitly return true or false
  }

  stopRiveMonster() {
    this.riveInstance?.stop();
  }


  public dispose() {
    this.riveInstance?.cleanup();
    this.riveInstance = null;
  }
}