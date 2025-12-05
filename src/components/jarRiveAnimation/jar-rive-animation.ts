import { JAR_PROGRESSION, CACHED_RIVE_WASM } from '@constants';
import { Rive, Layout, Fit, Alignment, RuntimeLoader, StateMachineInput, EventType, RiveEventPayload } from '@rive-app/canvas';
import gameStateService from '@gameStateService';
import { ProgressionScene } from '../../scenes/progress-scene/progress-scene';
//For handling rive in offline mode.
RuntimeLoader.setWasmUrl(CACHED_RIVE_WASM);

export class JarRiveAnimation {

  private riveInstance: Rive;
  private stateMachineName: string = "State Machine 1";

  private BONUS_RIVE_EVENT = "BonusFillEvent";
  private END_RIVE_EVENT = "EndEvent";
  private FILL_RIVE_EVENT = "StarFillEvent";

  private delaySwitchToLevelend: number = 1000;

  private fillPercentStateInput: StateMachineInput;
  private scoreStateInput: StateMachineInput;

  constructor(
    canvas: HTMLCanvasElement, 
    private readonly initialFillPercent: number,
    private readonly targetFillPercent: number,
    private readonly bonusFillPercent: number,
    private readonly stars: number
  ){
    this.initializeRive(canvas);
  }

  private initializeRive(canvas: HTMLCanvasElement): void {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    // We can increase or decrease the percent at which the min Y need to be set (0.25 = 25%)
    const minY = canvasHeight * 0.25;
    const maxY = canvasHeight;
    const riveConfig: any = {
      src: JAR_PROGRESSION,
      canvas: canvas,
      autoplay: false,
      useOffscreenRenderer: true,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
        minX: 0,
        minY,
        maxX: canvasWidth,
        maxY,
      }),
      stateMachines: [this.stateMachineName]
    };

    this.riveInstance = new Rive({
      ...riveConfig,
      onLoad: () => {
        this.riveOnLoadCallback();
      }
    });
  }

  /**
   * Get the state machine inputs defined in the rive file.
   * @return { fillPercentState: StateMachineInput, scoreState: StateMachineInput }
   */
  private initStateInputs(): void {
    const inputStateMachine_1 = "Fill Percent";
    const inputStateMachine_2 = "Score";
    const inputs = this.riveInstance.stateMachineInputs(this.stateMachineName);
    const fillPercentState = inputs.find(i => i.name === inputStateMachine_1);
    const scoreState = inputs.find(i => i.name === inputStateMachine_2);
    this.fillPercentStateInput = fillPercentState;
    this.scoreStateInput = scoreState;
  }

  /**
   * Rive onLoad callback — invoked automatically when the Rive file finishes loading.
   * Handles initialization of state machine inputs and orchestrates the jar fill
   * and score animations once the Rive instance is ready.
  */
  private riveOnLoadCallback() {
    this.initStateInputs();
    
    this.setScoreInput(this.stars);
    this.setJarFill(this.initialFillPercent);
    
    this.riveInstance.play();

    this.riveInstance.on(EventType.RiveEvent, (event) => {
      const eventName = (event.data as RiveEventPayload).name;
      switch(eventName) {
        case this.END_RIVE_EVENT:
          gameStateService.publish(ProgressionScene.END_JAR_EVENT, {});
          break;
        case this.FILL_RIVE_EVENT:
          this.setJarFill(this.targetFillPercent);
          break;
        case this.BONUS_RIVE_EVENT:
          this.setJarFill(this.bonusFillPercent);
          break;
      }
    });
  }

  public setScoreInput(score: number) {
    this.scoreStateInput.value = score;
    if (score > 0) this.scoreStateInput.fire();
  }

  public setJarFill(jarValue: number) {
    this.fillPercentStateInput.value = jarValue;
    this.fillPercentStateInput.fire();
  }

  public stopRive(): void {
    this.riveInstance?.stop();
  }

  public dispose(): void {
    if (!this.riveInstance) return;
    this.riveInstance?.cleanup();
  }
};