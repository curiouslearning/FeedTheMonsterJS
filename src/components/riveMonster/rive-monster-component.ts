import { MONSTER_PHASES, CACHED_RIVE_WASM, EventType, EventNames } from '@constants';
import { Rive, Layout, Fit, Alignment, RuntimeLoader } from '@rive-app/canvas';
import gameSettingsService from '@gameSettingsService';
import gameStateService from '@gameStateService';
import { RiveComponent, RiveComponentConfig } from '@components/riveComponent/rive-component';
import { AudioPlayer } from '@components/audio-player';

RuntimeLoader.setWasmUrl(CACHED_RIVE_WASM);
export interface RiveMonsterComponentProps {
  canvas: HTMLCanvasElement; // Canvas element where the animation will render
  autoplay: boolean;
  fit?: string; // Fit property (e.g contain, cover, etc.)
  alignment?: string; // Alignment property (e.g topCenter, bottomLeft, etc.)
  width?: number; // Optional width for the Rive animation
  height?: number; // Optional height for the Rive animation
  onLoad?: () => void; // Callback once Rive animation is loaded
  src?: string;
  isEvolving?: boolean;
}
export class RiveMonsterComponent extends RiveComponent {

  public static readonly DISAPPOINTED_SFX_EVENT = "DisappointedSFX";
  public static readonly EAT_SFX_EVENT = "EatSFX";
  public static readonly SPIT_SFX_EVENT = "MonsterSpitSFX";

  public static readonly DISAPPOINTED_SFX_AUDIO = "./assets/audios/MonsterGameplay/Disappointed.mp3"
  public static readonly EAT_SFX_AUDIO = "./assets/audios/MonsterGameplay/Eat.mp3"
  public static readonly SPIT_SFX_AUDIO = "./assets/audios/MonsterGameplay/Spit.mp3"

  private phaseIndex: number = 0;
  protected stateMachineName: string = "State Machine 1"  // Define the state machine
  private hitboxRangeX: {
    from: number;
    to: number;
  };
  private hitboxRangeY: {
    from: number;
    to: number;
  };
  private scale: number;

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

  constructor(protected readonly props: RiveMonsterComponentProps) {
    super(props.canvas);
    this.init();
    this.scale = gameSettingsService.getDevicePixelRatioValue();

    this.initializeHitbox();
    this.preloadAudioAssets();
    this.initializeListeners();
  }

  protected preloadAudioAssets(): void {
    AudioPlayer.instance.preloadGameAudio(RiveMonsterComponent.DISAPPOINTED_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(RiveMonsterComponent.EAT_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(RiveMonsterComponent.SPIT_SFX_AUDIO);
  }
  
  protected initializeListeners(): void {
    
    this.subscribe(RiveMonsterComponent.DISAPPOINTED_SFX_EVENT, () => { AudioPlayer.instance.playAudio(RiveMonsterComponent.DISAPPOINTED_SFX_AUDIO); });
    this.subscribe(RiveMonsterComponent.EAT_SFX_EVENT, () => { AudioPlayer.instance.playAudio(RiveMonsterComponent.EAT_SFX_AUDIO); });
    this.subscribe(RiveMonsterComponent.SPIT_SFX_EVENT, () => { AudioPlayer.instance.playAudio(RiveMonsterComponent.SPIT_SFX_AUDIO); });
  }

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
  }

  protected override createRiveConfig(): RiveComponentConfig {
    const { isEvolving, src, autoplay } = this.props;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    // We can increase or decrease the percent at which the min Y need to be set (0.25 = 25%)
    const minY = canvasHeight * 0.25;
    const maxY = canvasHeight;
    return {
      
      src: src || MONSTER_PHASES[this.phaseIndex],
      canvas: this.canvas,
      autoplay: autoplay,
      fit: Fit.Contain,
      alignment: Alignment.Center,
      minY: minY,
      maxX: canvasWidth,
      maxY: maxY,
      stateMachine: this.stateMachineName,
      onLoad: !isEvolving ? () => this.handleLoad() : undefined,
    };
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
}