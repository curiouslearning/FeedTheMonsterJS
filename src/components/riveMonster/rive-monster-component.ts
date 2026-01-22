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

  stopRiveMonster() {
    this.riveInstance?.stop();
  }
}