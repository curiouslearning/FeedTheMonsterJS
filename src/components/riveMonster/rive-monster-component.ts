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
  src?: string; // Source path for the Rive animation file,
  isEvolving?: boolean; // Flag to indicate if the monster is evolving
  moveCanvasUpOrDown?: number;
}

export class RiveMonsterComponent {
  private props: RiveMonsterComponentProps;
  private riveInstance: any;
  private src: string = './assets/eggMonsterFTM.riv';  // Default fallback value
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
    EVOLUTION: "Evolution", //New animation
  };

  constructor(props: RiveMonsterComponentProps) {
    this.props = props;
    this.src = props.src || this.src; // Use provided src or default
    this.moveCanvasUpOrDown(this.props.moveCanvasUpOrDown || 50); // Move down by 50px
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
    const config = {
      src: this.src,
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      layout: new Layout({ 
        fit: Fit.Contain, 
        alignment: Alignment.Center 
      }),
      onLoad: this.handleLoad.bind(this),
      useOffscreenRenderer: true // Improves performance
    };

    // For evolution animations, we don't use state machines
    if (!this.props.isEvolving) {
      config['stateMachines'] = [this.stateMachineName];
    }

    this.riveInstance = new Rive(config);
  }

  getInputs() {
    console.log('getInputs', this.riveInstance.stateMachineInputs(this.stateMachineName));
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
    // Skip trigger checks if monster is evolving
    if (!this.props.isEvolving) {
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
    try {
      if (this.props.isEvolving) {
        // For evolution animations, directly play the animation
        if (this.riveInstance) {
          // Get available animations
          const animations = RiveMonsterComponent.Animations;
          console.log('Static animations:', animations);
          console.log('Available animations:', this.riveInstance.animations);
          
          if (this.riveInstance.animations.includes(animationName)) {
            this.riveInstance.play(animationName);
          } else {
            console.warn(`Animation ${animationName} not found. Available animations:`, this.riveInstance.animations);
          }
        }
      } else {
        // For regular monster animations, try state machine first
        const input = this.getInputs().find(input => input.name === animationName);
        if (input) {
          input.fire();
          return;
        }
        
        // Fallback to direct animation
        if (this.riveInstance) {
          this.riveInstance.play(animationName);
        }
      }
    } catch (error) {
      console.error(`Error playing animation ${animationName}:`, error);
    }
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

  // Add this method to get available animations
  public getAvailableAnimations(): string[] {
    console.log('riveInstance', this.riveInstance);
    return this.riveInstance?.animations || [];
  }

  public dispose() {
    this.riveInstance?.cleanup();
    this.riveInstance = null;
  }
}