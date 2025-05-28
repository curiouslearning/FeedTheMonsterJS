import { MONSTER_PHASES, CACHED_RIVE_WASM } from '@constants';
import { Rive, Layout, Fit, Alignment, RuntimeLoader } from '@rive-app/canvas';
import gameSettingsService from '@gameSettingsService';
import gameStateService from '@gameStateService';

RuntimeLoader.setWasmUrl(CACHED_RIVE_WASM);
export interface RiveMonsterComponentProps {
  canvas: HTMLCanvasElement; // Canvas element where the animation will render
  autoplay: boolean;
  fit?: string; // Fit property (e.g contain, cover, etc.)
  alignment?: string; // Alignment property (e.g topCenter, bottomLeft, etc.)
  width?: number; // Optional width for the Rive animation
  height?: number; // Optional height for the Rive animation
  onLoad?: () => void; // Callback once Rive animation is loaded
  gameCanvas?: HTMLCanvasElement; // Main canvas element
  src?: string;
  isEvolving?: boolean;
}

// Complete and exhaustive list of all possible Rive Event Types. Ensure this enum stays up-to-date for TypeScript type checking.
export enum EventType {
  Load = "load", // When Rive has successfully loaded in the Rive file
  LoadError = "loaderror", // When Rive cannot load the Rive file
  Play = "play", // When Rive plays an entity or resumes the render loop
  Pause = "pause", // When Rive pauses the render loop and playing entity
  Stop = "stop", // When Rive stops the render loop and playing entity
  Loop = "loop", // (Singular animations only) When Rive loops an animation 
  Advance = "advance", // When Rive advances the animation in a frame
  StateChange = "statechange", // When a Rive state change is detected
  RiveEvent = "riveevent", // When a Rive Event gets reported
}
//Event names to access EventType objects.
type EventNames = 'Load' | 'LoadError' | 'Play' | 'Pause' | 'Stop' | 'Loop' | 'Advance' | 'StateChange' | 'RiveEvent';
export class RiveMonsterComponent {
  private props: RiveMonsterComponentProps;
  private riveInstance: Rive;
  private phaseIndex: number = 0;
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
  private scale: number;
  private minY: number;
  constructor(props: RiveMonsterComponentProps) {
    this.props = props;
    this.scale = gameSettingsService.getDevicePixelRatioValue();
    // add extra space above the monster in the Rive file this ensures proper animation, it will causes the monster to be placed at the bottom of the screen
    this.setRiveMinYAdjustment();
    this.initializeHitbox();
    this.initializeRive();
  }

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

  private initializeHitbox() {
    const { canvas } = this.props;
    const logicalCanvasWidth = canvas.width / this.scale;
    const logicalCanvasHeight = canvas.height / this.scale;

    const aspectRatio = window.innerWidth / window.innerHeight;

    const breakpoints = [
      { max: 0.4, bottomY: 0.78, height: 0.28 },
      { max: 0.5, bottomY: 0.82, height: 0.32 },
      { max: 0.6, bottomY: 0.85, height: 0.35 },
      { max: 0.7, bottomY: 0.84, height: 0.36 },
      { max: 0.8, bottomY: 0.88, height: 0.38 },
    ];

    const defaultValues = { bottomY: 0.90, height: 0.40 };

    const { bottomY, height } = breakpoints.find(b => aspectRatio < b.max) || defaultValues;

    const monsterBottomY = logicalCanvasHeight * bottomY;
    const monsterHeight = logicalCanvasHeight * height;
    const monsterTopY = monsterBottomY - monsterHeight;

    const hitboxOffsetY = monsterHeight * 0.05;
    const hitboxPaddingY = monsterHeight * 0.1;

    this.hitboxRangeX = {
      from: logicalCanvasWidth * 0.35,
      to: logicalCanvasWidth * 0.65,
    };

    this.hitboxRangeY = {
      from: monsterTopY + hitboxPaddingY + hitboxOffsetY,
      to: monsterBottomY - hitboxPaddingY + hitboxOffsetY,
    };

    gameStateService.saveHitBoxRanges({ hitboxRangeX: this.hitboxRangeX, hitboxRangeY: this.hitboxRangeY });
  }

  /**
   * Call this in a draw method in gameplay-scene. FOR TESTING ONLY.
   * @param context 
   */
  public createHitboxOverlayForTesting(context: CanvasRenderingContext2D) {
    // Calculate width and height
    const width = this.hitboxRangeX.to - this.hitboxRangeX.from;
    const height = this.hitboxRangeY.to - this.hitboxRangeY.from;

    // Draw the rectangle
    context.fillStyle = 'rgba(0, 128, 255, 0.5)';
    context.fillRect(this.hitboxRangeX.from, this.hitboxRangeY.from, width, height);

    // Optional: Draw border
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.strokeRect(this.hitboxRangeX.from, this.hitboxRangeY.from, width, height);


  //   document.getElementById('overlay').appendChild(rect);
  }

  public initializeRive() {
    const { canvas, isEvolving, src, autoplay } = this.props;

    if (isEvolving && this.riveInstance) {
      this.riveInstance.cleanupInstances();
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const riveConfig: any = {
      src: src || MONSTER_PHASES[this.phaseIndex],
      canvas,
      autoplay,
      useOffscreenRenderer: true,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
    };

    if (!isEvolving) {
      riveConfig.stateMachines = [this.stateMachineName];
      riveConfig.onLoad = () => this.handleLoad();

      // We can increase or decrease the percent at which the min Y need to be set (0.25 = 25%)
      const minY = canvasHeight * 0.25;
      const maxY = canvasHeight;

      riveConfig.layout = new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
        minX: 0,
        minY,
        maxX: canvasWidth,
        maxY,
      });
    }

    this.evolutionOffSet(!isEvolving ? 0 : 50);

    this.riveInstance = new Rive(riveConfig);
  }

  /**
   * This method adjusts the alignment of the Rive animation to the evolution
   * background on different screen sizes, ensuring consistent positioning across devices.
   */
  private setRiveMinYAdjustment(): void {
    const { width, height } = this.props.canvas
    const scaledWidth = Math.round(width / this.scale); // (width multiplied by devicePixelRatio) / devicePixelRatio to get the original screen width.
    const scaledHeight = Math.round(height / this.scale);  // (height multiplied by devicePixelRatio) / devicePixelRatio to get the original screen height.

    // Default minY adjustment
    let minY;
    // Determine minY based on scaled width and height
    if (scaledWidth >= 500) {
      minY = scaledHeight / 14; // Adjusted from (height / 4) / 3.5 for clarity
    } else if (scaledWidth <= 499 && scaledWidth >= 343 && scaledHeight >= 735) {
      minY = scaledHeight / 2;
    } else {
      minY = scaledHeight / 4;
    }


    // Dynamic adjustment based on scaledHeight (5% of the height)
    minY -= scaledHeight * 0.05;

    // Store the calculated minY
    this.minY = minY;
  }

  /**
   * Used to add additional logic to any events happening in Rive.
   *
   * Params:
   *  eventName = 'Load' | 'LoadError' | 'Play' | 'Pause' | 'Stop' | 'Loop' | 'Advance' | 'StateChange' | 'RiveEvent'
   *  callback - callback for the method to calls for that event.
   **/
  public executeRiveAction(eventName: EventNames, callback) {
    // Listens for the specified event on the `riveInstance` and triggers the provided callback when the event occurs.
    // This allows custom logic to be executed in response to Rive events (e.g., Play, Load, etc.).
    this.riveInstance.on(EventType[eventName], () => {
      callback();
    });
  }

  getInputs() {
    // Don't try to get state machine inputs if we're in evolution mode
    if (this.props.isEvolving) {
      return [];
    }
    return this.riveInstance.stateMachineInputs(this.stateMachineName);
  }

  /**
The extra space above the monster in the Rive file ensures proper animation, but it causes the monster to be placed at the bottom of the screen (due to those excess spaces)). The moveCanvasUpOrDown function adjusts the position of the animation after it plays, removing the unnecessary space above and only used on the evolution animation because the other Rive monsters doesn't have an excessive spacing.
*/
  public evolutionOffSet(offsetY: number) {
    //Set a fix of 50px on top for rive to properly align the evolution scene.
    const canvas = this.props.canvas;
    canvas.style.top = `${offsetY}px`;
  }


  handleLoad() {
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
  private cleanupRiveInstance() {
    this.riveInstance?.cleanup();
    this.riveInstance = null;
  }

  public dispose() {
    if (!this.riveInstance) return;
    this.cleanupRiveInstance();
  }
}