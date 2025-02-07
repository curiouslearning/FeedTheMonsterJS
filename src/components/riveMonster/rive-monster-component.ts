import { MONSTER_PHASE_1 } from '@constants';
import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

interface RiveMonsterComponentProps {
  canvas: HTMLCanvasElement; // Canvas element where the animation will render
  autoplay: boolean;
  fit?: string; // Fit property (e.g contain, cover, etc.)
  alignment?: string; // Alignment property (e.g topCenter, bottomLeft, etc.)
  width?: number; // Optional width for the Rive animation
  height?: number; // Optional height for the Rive animation
  onLoad?: () => void; // Callback once Rive animation is loaded
  gameCanvas?: HTMLCanvasElement; // Main canvas element
  src?: string; // Source path for the Rive animation file
}

export class RiveMonsterComponent {
  private props: RiveMonsterComponentProps;
  private riveInstance: any;
  private src?: string;  // Will be set from props or default
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
  // Static readonly properties for all monster animations
  public static readonly Animations = {
    //new animation
    IDLE: "Idle",
    SAD: "Sad",
    STOMP: "Stomp", //Not working
    STOMPHAPPY: "StompHappy",
    SPIT: "Spit",
    CHEW: "Chew", //Not working
    MOUTHOPEN: "MouthOpen",
    MOUTHCLOSED: "MouthClosed", //Not working
    HAPPY: "Happy", //Not working
  };

  constructor(props: RiveMonsterComponentProps) {
    this.props = props;
    this.src = props.src || MONSTER_PHASE_1; // Use provided src or default
    this.moveCanvasUpOrDown(50); // Move down by 50px
    const scale = window.devicePixelRatio || 1;
    const monsterCenterX = (props.canvas.width / scale) / 2;
    const monsterCenterY = (props.canvas.height / scale) / 2; 
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

    this.initializeRive();
  }

  private initializeRive() {
    this.riveInstance = new Rive({
      src: this.src,
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      stateMachines: [this.stateMachineName],
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      onLoad: this.handleLoad.bind(this),
      useOffscreenRenderer: true, // Improves performance
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

    return this.validateRange(x, y);
  }

  private validateRange(x, y) {
    const isWithinHitboxX =
      x >= this.hitboxRangeX.from && x <= this.hitboxRangeX.to;
    const isWithinHitboxY =
      y >= this.hitboxRangeY.from && y <= this.hitboxRangeY.to;

    return isWithinHitboxX && isWithinHitboxY;
  }

  // Example click handler
  onClick(xClick: number, yClick: number): boolean {

    return this.validateRange(xClick, yClick); // Explicitly return true or false
  }

  stopRiveMonster() {
    this.riveInstance?.stop();
  }


  public dispose() {
    this.riveInstance?.cleanup();
    this.riveInstance = null;
  }
}