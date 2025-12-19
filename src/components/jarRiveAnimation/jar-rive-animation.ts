import { JAR_PROGRESSION } from '@constants';
import { StateMachineInput, Fit, Alignment } from '@rive-app/canvas';
import { RiveComponent, RiveComponentConfig } from '../riveComponent/rive-component';

export class JarRiveAnimation extends RiveComponent {

  public readonly BONUS_RIVE_EVENT = "BonusFillEvent";
  public readonly END_RIVE_EVENT = "EndEvent";
  public readonly FILL_RIVE_EVENT = "StarFillEvent";

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

  private initializeListeners(): void {
    this.subscribe(this.FILL_RIVE_EVENT, () => { this.setJarFill(this.targetFillPercent); });
    this.subscribe(this.BONUS_RIVE_EVENT, () => { this.setJarFill(this.bonusFillPercent);});
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
