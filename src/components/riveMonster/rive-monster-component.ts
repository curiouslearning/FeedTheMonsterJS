import {Rive, Layout, Fit, Alignment} from '@rive-app/canvas';

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
  private src: string = './assets/monsterrive.riv'; // Define the .riv file path
  private stateMachines: string = 'State Machine 1'; // Define the state machine
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
    OPENING_MOUTH_EAT: 'Opening Mouth Eat',
    EAT_HAPPY: 'Eat Happy',
    IDLE: 'Idle',
    EAT_DISGUST: 'Eat Disgust',
  };

  constructor(props: RiveMonsterComponentProps) {
    this.props = props;
    this.game = this.props.gameCanvas;

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

    // Initialize Rive
    this.riveInstance = new Rive({
      src: this.src,
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      stateMachines: this.stateMachines,
      layout: new Layout({
        fit: Fit[this.props.fit || 'Contain'],
        alignment: Alignment[this.props.alignment || 'TopCenter'],
      }),
      onLoad: () => {
        if (this.props.onLoad) {
          this.props.onLoad();
        }
      },
    });

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

  play(animationName: string) {
    if (this.riveInstance) {
      this.riveInstance.play(animationName);
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
    const centerX = this.x + this.game.width / 4;
    const centerY = this.y + this.game.height / 2.2;

    const distance = Math.sqrt(
      (xClick - centerX) * (xClick - centerX) +
        (yClick - centerY) * (yClick - centerY),
    );

    return distance <= 100; // Explicitly return true or false
  }

  stopRiveMonster() {
    if (this.riveInstance) {
      this.riveInstance.stop();
      console.log("Rive Monster animation stopped.");
    }
  }

  private unregisterEventListener() {
    if (this.riveInstance) {
      this.riveInstance.cleanup();
    }
  }

  public dispose() {
    console.log('Rive Monster disposed.');
    this.unregisterEventListener();
    if (this.riveInstance) {
      this.riveInstance = null;
    }
  }
}
