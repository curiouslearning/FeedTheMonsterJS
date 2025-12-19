import { JAR_PROGRESSION } from '@constants';
import { Fit, Alignment } from '@rive-app/canvas';
import { RiveComponent, RiveComponentConfig } from '../riveComponent/rive-component';
import { AudioPlayer } from '@components/audio-player';

export class JarRiveAnimation extends RiveComponent {

  public static readonly BONUS_RIVE_EVENT = "BonusFillEvent";
  public static readonly END_RIVE_EVENT = "EndEvent";
  public static readonly FILL_RIVE_EVENT = "StarFillEvent";
  public static readonly JAR_FILL_SFX_EVENT = "JarFillSFX";
  public static readonly BONUS_SFX_EVENT = "BonusSFX";
  public static readonly SWOOSH_SFX_EVENT = "SwooshSFX";
  public static readonly SHINE_SFX_EVENT = "ShineSFX";
  public static readonly MATCHBOX_SFX_EVENT = "MatchboxSFX";

  public static readonly BONUS_SFX_AUDIO = "./assets/audios/jarprogression/BonusSFX.mp3"
  public static readonly FILL_SFX_AUDIO = "./assets/audios/jarprogression/JarFillSFX.mp3"
  public static readonly SWOOSH_SFX_AUDIO = "./assets/audios/jarprogression/SwooshSFX.mp3"
  public static readonly SHINE_SFX_AUDIO = "./assets/audios/jarprogression/ShineSFX.mp3"
  public static readonly MATCHBOX_SFX_AUDIO = "./assets/audios/jarprogression/MatchboxSFX.mp3"

  private readonly INPUT_FILL_PERCENT = "Fill Percent";
  private readonly INPUT_SCORE = "Score";
  private readonly INPUT_IS_BONUS = "isBonus";

  constructor(
    canvas: HTMLCanvasElement, 
    private readonly initialFillPercent: number,
    private readonly targetFillPercent: number,
    private readonly bonusFillPercent: number,
    private readonly stars: number,
    private readonly isBonus: boolean
  ){
    super(canvas);
    this.init();
    this.preloadAudioAssets();
    this.initializeListeners();
  }

  protected override createRiveConfig(): RiveComponentConfig {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    // We can increase or decrease the percent at which the min Y need to be set (0.25 = 25%)
    const minY = canvasHeight * 0.25;
    const maxY = canvasHeight;
    return {
      
      src: JAR_PROGRESSION,
      canvas: this.canvas,
      autoplay: false,
      fit: Fit.Contain,
      alignment: Alignment.Center,
      minY: minY,
      maxX: canvasWidth,
      maxY: maxY,
      stateMachine: "State Machine 1"
    };
  }
  
  private preloadAudioAssets(): void {
    AudioPlayer.instance.preloadGameAudio(JarRiveAnimation.FILL_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(JarRiveAnimation.BONUS_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(JarRiveAnimation.SWOOSH_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(JarRiveAnimation.SHINE_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(JarRiveAnimation.MATCHBOX_SFX_AUDIO);
  }

  private initializeListeners(): void {
    
    this.subscribe(JarRiveAnimation.FILL_RIVE_EVENT, () => { this.setJarFill(this.targetFillPercent); });
    this.subscribe(JarRiveAnimation.BONUS_RIVE_EVENT, () => { this.setJarFill(this.bonusFillPercent);});
    this.subscribe(JarRiveAnimation.JAR_FILL_SFX_EVENT, () => { AudioPlayer.instance.playAudio(JarRiveAnimation.FILL_SFX_AUDIO); });
    this.subscribe(JarRiveAnimation.BONUS_SFX_EVENT, () => { AudioPlayer.instance.playAudio(JarRiveAnimation.BONUS_SFX_AUDIO); });
    this.subscribe(JarRiveAnimation.SWOOSH_SFX_EVENT, () => { AudioPlayer.instance.playAudio(JarRiveAnimation.SWOOSH_SFX_AUDIO); });
    this.subscribe(JarRiveAnimation.SHINE_SFX_EVENT, () => { AudioPlayer.instance.playAudio(JarRiveAnimation.SHINE_SFX_AUDIO); });
    this.subscribe(JarRiveAnimation.MATCHBOX_SFX_EVENT, () => { AudioPlayer.instance.playAudio(JarRiveAnimation.MATCHBOX_SFX_AUDIO); });
  }

  /**
   * Rive onLoad callback — invoked automatically when the Rive file finishes loading.
   * Handles initialization of state machine inputs and orchestrates the jar fill
   * and score animations once the Rive instance is ready.
  */
  protected override riveOnLoadCallback() {
    super.riveOnLoadCallback();
    
    this.setScoreInput(this.stars);
    this.setJarFill(this.initialFillPercent);
    this.setIsBonus(this.isBonus);
    
    this.riveInstance.play();
  }

  public setScoreInput(score: number) {
    this.setNumberInput(this.INPUT_SCORE, score);
  }

  public setJarFill(jarValue: number) {
    this.setNumberInput(this.INPUT_FILL_PERCENT, jarValue);
  }

  public setIsBonus(isBonus: boolean) {
    this.setBooleanInput(this.INPUT_IS_BONUS, isBonus);
  }

  public stopRive(): void {
    this.stop();
  }
}
