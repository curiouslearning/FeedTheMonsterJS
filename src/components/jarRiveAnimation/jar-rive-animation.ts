import { JAR_PROGRESSION } from '@constants';
import { Fit, Alignment } from '@rive-app/canvas';
import { RiveComponent, RiveComponentConfig } from '../riveComponent/rive-component';
import { AudioPlayer } from '@components/audio-player';

export class JarRiveAnimation extends RiveComponent {

  public readonly BONUS_RIVE_EVENT = "BonusFillEvent";
  public readonly END_RIVE_EVENT = "EndEvent";
  public readonly FILL_RIVE_EVENT = "StarFillEvent";
  public readonly JAR_FILL_SFX_EVENT = "JarFillSFX";
  public readonly BONUS_SFX_EVENT = "BonusSFX";
  public readonly SWOOSH_SFX_EVENT = "SwooshSFX";
  public readonly SHINE_SFX_EVENT = "ShineSFX";
  public readonly MATCHBOX_SFX_EVENT = "MatchboxSFX";

  public readonly BONUS_SFX_AUDIO = "./assets/audios/BonusSFX.mp3"
  public readonly FILL_SFX_AUDIO = "./assets/audios/JarFillSFX.mp3"
  public readonly SWOOSH_SFX_AUDIO = "./assets/audios/SwooshSFX.mp3"
  public readonly SHINE_SFX_AUDIO = "./assets/audios/ShineSFX.mp3"
  public readonly MATCHBOX_SFX_AUDIO = "./assets/audios/MatchboxSFX.mp3"

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
    AudioPlayer.instance.preloadGameAudio(this.FILL_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(this.BONUS_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(this.SWOOSH_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(this.SHINE_SFX_AUDIO);
    AudioPlayer.instance.preloadGameAudio(this.MATCHBOX_SFX_AUDIO);
  }

  private initializeListeners(): void {
    
    this.subscribe(this.FILL_RIVE_EVENT, () => { this.setJarFill(this.targetFillPercent); });
    this.subscribe(this.BONUS_RIVE_EVENT, () => { this.setJarFill(this.bonusFillPercent);});
    this.subscribe(this.JAR_FILL_SFX_EVENT, () => { AudioPlayer.instance.playAudio(this.FILL_SFX_AUDIO); });
    this.subscribe(this.BONUS_SFX_EVENT, () => { AudioPlayer.instance.playAudio(this.BONUS_SFX_AUDIO); });
    this.subscribe(this.SWOOSH_SFX_EVENT, () => { AudioPlayer.instance.playAudio(this.SWOOSH_SFX_AUDIO); });
    this.subscribe(this.SHINE_SFX_EVENT, () => { AudioPlayer.instance.playAudio(this.SHINE_SFX_AUDIO); });
    this.subscribe(this.MATCHBOX_SFX_EVENT, () => { AudioPlayer.instance.playAudio(this.MATCHBOX_SFX_AUDIO); });
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
