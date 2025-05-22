import { MONSTER_PHASES, CACHED_RIVE_WASM } from '@constants';
import { Rive, Layout, Fit, Alignment, RuntimeLoader } from '@rive-app/canvas';
import gameSettingsService from '@gameSettingsService';

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
    // Calculate logical canvas dimensions based on scale (DPR compensation)
    const logicalCanvasWidth = this.props.canvas.width / this.scale;
    const logicalCanvasHeight = this.props.canvas.height / this.scale;

    const aspectRatio = window.innerWidth / window.innerHeight;

    // Assume logicalCanvasHeight is already adjusted for DPR
    let monsterBottomY: number;
    let monsterHeight: number;
    // Adjust monster's position and size based on aspect ratio
    if (aspectRatio < 0.4) {
      // Extremely tall screens (e.g., ultra-narrow phones or split-screen)
      monsterBottomY = logicalCanvasHeight * 0.78;
      monsterHeight = logicalCanvasHeight * 0.28;
    }
    else if (aspectRatio < 0.5) {
      // Tall screens (e.g., older iPhones in zoomed mode)
      monsterBottomY = logicalCanvasHeight * 0.82;
      monsterHeight = logicalCanvasHeight * 0.30;
    }
    else if (aspectRatio < 0.6) {
      // Tall screens (narrow phones)
      monsterBottomY = logicalCanvasHeight * 0.83;
      monsterHeight = logicalCanvasHeight * 0.33;
    } else if (aspectRatio < 0.7) {
      // Typical phones (iPhone 13, Android phones)
      monsterBottomY = logicalCanvasHeight * 0.84;
      monsterHeight = logicalCanvasHeight * 0.36;
    } else if (aspectRatio < 1.3) {
      // Tablets (iPads)
      monsterBottomY = logicalCanvasHeight * 0.88;
      monsterHeight = logicalCanvasHeight * 0.38;
    } else {
      // Desktops or landscape tablets
      monsterBottomY = logicalCanvasHeight * 0.90;
      monsterHeight = logicalCanvasHeight * 0.40;
    }
    // Compute the monster's top Y-coordinate
    const monsterTopY = monsterBottomY - monsterHeight;

    // Apply an offset to move hitbox up/down relative to the monster
    const hitboxOffsetPercent = 0.05; // Example: shift hitbox slightly upwards (5% of monster height)
    const hitboxOffsetY = monsterHeight * hitboxOffsetPercent

    // Add vertical padding to the hitbox to avoid edge sensitivity
    const hitboxPaddingY = monsterHeight * 0.1; // 10% padding top & bottom

    // Define horizontal hitbox (centered horizontally, covering 30% of canvas width)
    this.hitboxRangeX = {
      from: (logicalCanvasWidth * 0.5) - (logicalCanvasWidth * 0.3) / 2,
      to: (logicalCanvasWidth * 0.5) + (logicalCanvasWidth * 0.3) / 2,
    };
    // Define vertical hitbox within the monster's bounds, excluding padding
    this.hitboxRangeY = {
      from: monsterTopY + hitboxPaddingY + hitboxOffsetY,
      to: monsterBottomY - hitboxPaddingY + hitboxOffsetY,
    };
  }

  // do not delete to check hitbox overlay
  // public createHitboxOverlay() {
  //   const rect = document.createElement('div');
  //   rect.className = 'rect';
  //   rect.style.left = `${this.hitboxRangeX.from}px`;
  //   rect.style.top = `${this.hitboxRangeY.from}px`;
  //   rect.style.width = `${this.hitboxRangeX.to - this.hitboxRangeX.from}px`;
  //   rect.style.height = `${this.hitboxRangeY.to - this.hitboxRangeY.from}px`;

  //   document.getElementById('overlay').appendChild(rect);
  // }

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

  initializeRive() {
    if (this.props.isEvolving && this.riveInstance) {
      this.riveInstance.cleanupInstances();
    }

    const riveConfig: any = {
      src: this.props.src || MONSTER_PHASES[this.phaseIndex],
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
      useOffscreenRenderer: true, // Improves performance
    };

    // For evolution animations, we don't use state machines. so were excluding this.
    if (!this.props.isEvolving) {
      riveConfig['stateMachines'] = [this.stateMachineName];
      riveConfig['onLoad'] = () => {
        this.handleLoad();
      };

      riveConfig['layout'] = new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
        minX: 0,
        minY: this.minY,
        maxX: this.props.canvas.width,
        maxY: this.props.canvas.height,
      });
    }

    this.evolutionOffSet(!this.props.isEvolving ? 0 : 50);

    this.riveInstance = new Rive(riveConfig);
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

  public getMonsterTopCordinate() {
    if (!this.hitboxRangeX || !this.hitboxRangeY) {
      console.warn("Hitbox range not available!");
      return null;
    }

    const scaledY = this.hitboxRangeY.from;
    const scaledHeight = this.hitboxRangeY.to - this.hitboxRangeY.from;
    const bottomYCenter = scaledY + scaledHeight;

    return bottomYCenter;
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