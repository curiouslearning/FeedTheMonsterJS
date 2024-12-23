import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';

interface RiveMonsterComponentProps {
  canvas: HTMLCanvasElement; // Canvas element where the animation will render
  autoplay: boolean;
  fit?: string; // Fit property (e.g contain, cover, etc.)
  alignment?: string; // Alignment property (e.g topCenter, bottomLeft, etc.)
  width?: number; // Optional width for the Rive animation
  height?: number; // Optional height for the Rive animation
  onLoad?: () => void; // Callback once Rive animation is loaded
  onStop?: (animationName?: string) => void; // Callback when an animation stops
  gameCanvas?: HTMLCanvasElement; // Main canvas element
}

export class RiveMonsterComponent {
  private props: RiveMonsterComponentProps;
  private riveInstance: any;
  private src: string = './assets/finalEggMonster.riv';  // Define the .riv file path
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
    this.x = this.props.canvas.width;
    this.y = this.props.canvas.height;
    this.hitboxRangeX = {
      from: 0,
      to: 0,
    };
    this.hitboxRangeY = {
      from: 0,
      to: 0,
    };
    //Adjust this range factor to control how big is the hit box for dropping stones.
    const rangeFactorX = 70; //SUBCTRACT FROM CENTER TO LEFT, ADD FROM CENTER TO RIGHT.
    const rangeFactorY = 50; //SUBCTRACT FROM CENTER TO TOP, ADD FROM CENTER TO BOTTOM.
    const monsterCenterX = this.x / 2;
    //Note: Rive height is currently always half of width. This might change when new rive files are to be implemented/
    const monsterCenterY = this.y / 2; //Create different sets of height for multiple rive files or adjust this for height when replacing the current rive monster.
    this.hitboxRangeX.from = monsterCenterX - rangeFactorX;
    this.hitboxRangeX.to = monsterCenterX + rangeFactorX;
    this.hitboxRangeY.from = monsterCenterY - rangeFactorY;
    this.hitboxRangeY.to = monsterCenterY + rangeFactorY;


    // Initialize Rive
    this.riveInstance = new Rive({
      src: this.src,
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      stateMachines: [this.stateMachineName],
      layout: new Layout({
        fit: Fit[this.props.fit || "Contain"],
        alignment: Alignment[this.props.alignment || "TopCenter"],
      }),
      onLoad: () => {
        // Retrieve state machine inputs
        const inputs = this.riveInstance.stateMachineInputs(this.stateMachineName);

        // Validate all necessary triggers are available
        const requiredTriggers = ['backToIdle', 'isStomped', 'isMouthOpen', 'isMouthClosed', 'isChewing', 'isHappy', 'isSpit', 'isSad'];
        const missingTriggers = requiredTriggers.filter(name => !inputs.some(input => input.name === name));

        if (missingTriggers.length) {
          console.error(`Missing state machine inputs: ${missingTriggers.join(', ')}`);
        }

        // Callback to handle state changes (optional debugging)
        this.riveInstance.onStateChange = (state) => {
          // console.log('Current state:', state);
        };

        if (this.props.onLoad) this.props.onLoad();
      }
    });
  }

  getInputs() {
    return this.riveInstance.stateMachineInputs(this.stateMachineName);
  }

  play(animationName: string, onComplete: (() => void) | null = null) {
    if (this.riveInstance) {
      this.riveInstance.play(animationName);

      // Check if the onComplete callback is provided
      if (onComplete) {
        // Assuming you can detect when the animation finishes (adjust with your animation system)
        this.riveInstance.on('animationComplete', () => {
          onComplete(); // Call the onComplete callback when the animation finishes
        });
      }
    }
  }


  stop() {
    if (this.riveInstance) {
      this.riveInstance.stop();
    }
  }

  // Check animation completion via a state machine listener need to have statemachines properly to test this
  onStateChange(callback: (stateName: string) => void) {
    this.riveInstance.stateMachine.inputs.forEach(input => {
      input.onStateChange(state => {
        callback(state);
      });
    });
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
    if (this.riveInstance) {
      this.riveInstance.stop();
    }
  }

  private unregisterEventListener() {
    if (this.riveInstance) {
      this.riveInstance.cleanup();
    }
  }

  public dispose() {
    this.unregisterEventListener();
    if (this.riveInstance) {
      this.riveInstance = null;
    }
  }
}