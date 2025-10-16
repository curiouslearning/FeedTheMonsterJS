import { JAR_PROGRESSION, CACHED_RIVE_WASM } from '@constants';
import { SCENE_NAME_LEVEL_END } from "@constants";
import { Rive, Layout, Fit, Alignment, RuntimeLoader, StateMachineInput } from '@rive-app/canvas';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
//For handling rive in offline mode.
RuntimeLoader.setWasmUrl(CACHED_RIVE_WASM);

export class ProgressionScene {
  private riveMonsterElement: HTMLCanvasElement;
  private riveInstance: Rive;
  private stateMachineName: string = "State Machine 1";
  private animations = {
    EMPTY: 'Empty',
    ONE_STAR: '1_stars',
    TWO_STARS: '2_stars',
    THREE_STARS: '3_stars',
    FOUR_STARS: '4_stars',
    FIVE_STARS: '5_stars',
    SIX_STARS: '6_stars',
    BONUS_STAR: '6.1_bonus Star',
  };
  private previousTotalStarCount: number = 0;
  private currentLevelStarEarned: number = 0;
  private treasureChestScore: number = 0;
  private previousLevelStarEarned: number = 0;
  private targetStarCountMaxFill: number = 0;
  private delayStateMachineInputs: number = 2000;
  private delaySwitchToLevelend: number = 4000;
  private isPassingScore: boolean = false;

  constructor() {
    const riveMonsterElement = gameSettingsService.getRiveCanvasValue();
    this.riveMonsterElement = riveMonsterElement;
    this.initializeValues();
    this.toggleCanvasBackground(true);
    this.initializeRive();
  }

  private initializeValues() {
    const {
      starCount,
      monsterPhaseNumber,
      treasureChestScore,
      previousLevelData,
      previousTotalStarCount,
      isPassingScore
    } = gameStateService.getLevelEndSceneData();

    this.isPassingScore = isPassingScore;
    this.previousTotalStarCount = previousTotalStarCount;
    this.currentLevelStarEarned = starCount;
    this.treasureChestScore = treasureChestScore;
    this.previousLevelStarEarned = previousLevelData ? previousLevelData.starCount : 0; //previousLevelData is null set to 0.
    this.targetStarCountMaxFill = this.getTargetStarCountForFill(monsterPhaseNumber);
  }

  private toggleCanvasBackground(isBlack: boolean): void {
    this.riveMonsterElement.style.backgroundColor = isBlack ? '#000' : '';
  }

  private initializeRive(): void {
    const canvasWidth = this.riveMonsterElement.width;
    const canvasHeight = this.riveMonsterElement.height;
    // We can increase or decrease the percent at which the min Y need to be set (0.25 = 25%)
    const minY = canvasHeight * 0.25;
    const maxY = canvasHeight;
    const riveConfig: any = {
      src: JAR_PROGRESSION,
      canvas: this.riveMonsterElement,
      autoplay: true,
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
  private getStateInputs(): { fillPercentState: StateMachineInput, scoreState: StateMachineInput } {
    const inputStateMachine_1 = "Fill Percent";
    const inputStateMachine_2 = "Score";
    const inputs = this.riveInstance.stateMachineInputs(this.stateMachineName);
    const fillPercentState = inputs.find(i => i.name === inputStateMachine_1);
    const scoreState = inputs.find(i => i.name === inputStateMachine_2);

    return { fillPercentState, scoreState };
  }

  /**
   * Rive onLoad callback — invoked automatically when the Rive file finishes loading.
   * Handles initialization of state machine inputs and orchestrates the jar fill
   * and score animations once the Rive instance is ready.
  */
  private riveOnLoadCallback() {
    const inputMachines = this.getStateInputs();

    // Compute how many new stars were earned compared to the previous level.
    //If the currentLevelStarEarned is below passing, skip jar fill.
    const newScoreEarned = this.isPassingScore
      ? (this.currentLevelStarEarned - this.previousLevelStarEarned)
      : 0;

    // Determine the jar’s previous fill percentage.
    const recentFillValue = this.getStarPercentage(
      this.previousTotalStarCount,
      this.targetStarCountMaxFill
    );

    // Determine the jar’s new target fill percentage.
    const newFillValue = this.getStarPercentage(
      this.previousTotalStarCount + newScoreEarned,
      this.targetStarCountMaxFill
    );

    /**
    * Tracks the cumulative delay time needed for all
    * fill and score animations to finish playing.
    *
    * This ensures that the Level End scene transition
    * only occurs *after* all Rive animations are complete.
    */
    let animationCompletionDelay = 0;

    // Define helper to play a fill after a delay and track the latest timeout
    const playFillAfterDelay = (
      jarFillInputValue: number,
      scoreInputValue: number,
      delay: number
    ) => {
      const hasAnimateScore = scoreInputValue > 0;
      const additionalDelay = hasAnimateScore ? this.delayStateMachineInputs : 0;
      animationCompletionDelay = delay + additionalDelay;

      setTimeout(() => {
        this.playStateMachineInput({ inputMachines, jarFillInputValue, scoreInputValue });
      }, delay);
    };

    // If the jar was previously filled, prefill it to the last known value before animating.
    // Otherwise a default 1 will be use to prevent StateMachine exceeded max iterations error as a score value is needed.
    this.playStateMachineInput({
      inputMachines,
      jarFillInputValue: recentFillValue > 0 ? recentFillValue : 1,
      scoreInputValue: 0
    });

    /**
   * Delay the next state machine input update so the fill and score animations
   * start in sync with Rive’s internal playback timing.
   *
   * The delay helps prevent race conditions where the fill animation would update
   * too early—ensuring that star scoring and jar filling visually align.
   */
    if (newFillValue > 0) {
      playFillAfterDelay(
        newFillValue,
        this.currentLevelStarEarned,
        this.delayStateMachineInputs
      );
    }

    //If there is a score for treasure Chest mini game.
    if (this.treasureChestScore) {
      const newFillWithMiniGameScore = this.getStarPercentage(
        this.previousTotalStarCount + newScoreEarned + this.treasureChestScore,
        this.targetStarCountMaxFill
      );

      // Bonus delay (e.g., after the star animation)
      const treasureDelay = this.delayStateMachineInputs + animationCompletionDelay;
      
      //Score value to trigger bonus star in rive progress jar.
      const bonusStarValue = 6;

      playFillAfterDelay(
        newFillWithMiniGameScore,
        bonusStarValue,
        treasureDelay
      );
    }

    // Schedule the animation cleanup and scene transition
    this.scheduleSceneTransition(animationCompletionDelay);
  }

  /**
   * Stops the current Rive animation and switches to the Level End scene
   * after all animations have finished.
   *
   * Adds an additional delay (delaySwitchToLevelend) to ensure the
   * jar and star animations fully complete before switching.
   */
  private scheduleSceneTransition(animationCompletionDelay: number): void {
    setTimeout(() => {
      // stop the state machine before switching scenes
      this.stopRive();

      // Notify the scene handler to clean up this class and load the Level End scene.
      gameStateService.publish(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        SCENE_NAME_LEVEL_END
      );
    }, animationCompletionDelay + this.delaySwitchToLevelend);
  }

  private playStateMachineInput({ inputMachines, jarFillInputValue, scoreInputValue }: {
    inputMachines: {
      fillPercentState: StateMachineInput,
      scoreState: StateMachineInput
    },
    jarFillInputValue: number,
    scoreInputValue: number
  }): void {

    const shouldAnimateStars = scoreInputValue > 0;

    // If stars were earned, trigger the score-related animation first.
    inputMachines.scoreState.value = scoreInputValue; //set score value;

    if (shouldAnimateStars) {
      inputMachines.scoreState.fire(); //animate the score.
    }

    /**
     * The jar fill update is delayed slightly so it aligns visually with
     * the score animation. Without this delay, the jar might fill too early,
     * making the star-to-fill transition feel out of sync.
     */
    setTimeout(() => {
      inputMachines.fillPercentState.value = jarFillInputValue;
      inputMachines.fillPercentState.fire();
    }, shouldAnimateStars ? this.delayStateMachineInputs : 0);
  }

  private getTargetStarCountForFill(monsterPhase: number): number {
    //Returns the target star count for certain monster phase.
    switch (monsterPhase) {
      case 2:
        return 63;
      case 1:
        return 38;
      case 0:
      default:
        return 12;
    }
  }

  private getStarPercentage(starsCount: number, targetStarCount: number): number {
    const maxJarFill = 63; //Hard cap on the rive file.

    return Math.round((starsCount / targetStarCount) * maxJarFill);
  }

  public draw(): void {
    //No need to add draw but required as to how scene classes are structured.
  }

  private stopRive(): void {
    this.riveInstance?.stop();
  }

  public dispose(): void {
    if (!this.riveInstance) return;
    this.toggleCanvasBackground(false);
    this.riveInstance?.cleanup();
  }
};