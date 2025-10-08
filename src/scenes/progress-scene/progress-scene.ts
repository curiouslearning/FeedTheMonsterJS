import { JAR_PROGRESSION, CACHED_RIVE_WASM } from '@constants';
import { SCENE_NAME_LEVEL_END } from "@constants";
import { Rive, Layout, Fit, Alignment, RuntimeLoader } from '@rive-app/canvas';
import gameStateService from '@gameStateService';
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
}

export class ProgressionScene {
  private riveInstance: Rive;
  private stateMachineName: string = "State Machine 1";
  private inputStateName: string = "Fill Percent";
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

  constructor() {
    this.initializeValues();
    this.initializeRive();
  }

  private initializeValues() {
    const {
      starCount,
      monsterPhaseNumber,
      treasureChestScore,
      previousLevelData,
      previousTotalStarCount
    } = gameStateService.getLevelEndSceneData();
    this.previousTotalStarCount = previousTotalStarCount;
    this.currentLevelStarEarned = starCount;
    this.treasureChestScore = treasureChestScore;
    this.previousLevelStarEarned = previousLevelData ? previousLevelData.starCount : 0; //previousLevelData is null set to 0.
    this.targetStarCountMaxFill = this.getTargetStarCountForFill(monsterPhaseNumber);
  }

  private initializeRive() {
    const riveMonsterElement = gameSettingsService.getRiveCanvasValue();

    const riveConfig: any = {
      src: JAR_PROGRESSION,
      canvas: riveMonsterElement,
      autoplay: true,
      useOffscreenRenderer: true,
      layout: new Layout({
        fit: Fit.Cover,
        alignment: Alignment.Center,
        minX: 0,
        minY: 0,
        maxX: riveMonsterElement.width,
        maxY: riveMonsterElement.height,
      }),
    };
    riveConfig.stateMachines = [this.stateMachineName];

    this.riveInstance = new Rive({
      ...riveConfig,
      onLoad: () => {
        this.riveOnLoadCallback();
      }
    });
  }

  private riveOnLoadCallback() {
    const inputs = this.riveInstance.stateMachineInputs(this.stateMachineName);
    const stateMachineInputName = inputs.find(i => i.name === this.inputStateName); // does the filling and add star animation

    //Set prefill value for jar.
    this.playStateMachineInput(
      stateMachineInputName,
      this.previousTotalStarCount,
      this.targetStarCountMaxFill
    );
    //Get the difference from the new score with the old score.
    const newScoreEarned = (this.currentLevelStarEarned - this.previousLevelStarEarned);
    let fillUpdate = 0;

    if (newScoreEarned) {
      //Get animation name based on overall total score.
      const animationName = this.getAnimationName(this.currentLevelStarEarned + this.treasureChestScore);
      this.playRiveAnimation(animationName);
      fillUpdate = this.currentLevelStarEarned + this.treasureChestScore;
    } else {
      //If on treasure chest has an updated score.
      this.playRiveAnimation(this.animations.BONUS_STAR);
      fillUpdate = this.treasureChestScore;
    }

    //Animated the new filling after star score animation.
    setTimeout(() => {
      this.playStateMachineInput(
        stateMachineInputName,
        fillUpdate,
        this.targetStarCountMaxFill
      );
    }, 3000);

    setTimeout(() => {
      gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_END);
    }, 8000)

    console.log({
      currentLevelStarEarned: this.currentLevelStarEarned,
      treasureChestScore: this.treasureChestScore,
      inputs,
      targetStarCountMaxFill: this.targetStarCountMaxFill,
      newScoreEarned,
      fillUpdate,
    })
  }

  private getTargetStarCountForFill(monsterPhase): number {
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

  private getAnimationName(earedStarCount: number): string {
    console.log({ earedStarCount })
    switch (earedStarCount) {
      case 6:
        return this.animations.SIX_STARS;
      case 5:
        return this.animations.FIVE_STARS;
      case 4:
        return this.animations.FOUR_STARS;
      case 3:
        return this.animations.THREE_STARS;
      case 2:
        return this.animations.TWO_STARS;
      case 1:
        return this.animations.ONE_STAR;
      case 0:
      default:
        return this.animations.EMPTY;
    }
  }

  private playStateMachineInput(
    stateMachineInput,
    totalStarEarned,
    targetStarCount
  ): void {
    stateMachineInput.value = this.getStarPercentage(totalStarEarned, targetStarCount);
    stateMachineInput.fire();
  }

  private getStarPercentage(starsCount: number, targetStarCount: number): number {
    const maxJarFill = 63; //Hard cap on the rive file.

    return Math.round((starsCount / targetStarCount) * maxJarFill);
  }

  private playRiveAnimation(animationName): void {
    this.riveInstance.play(animationName);
  }

  public draw() {
    //Default play animation.
    this.riveInstance?.play(this.animations.EMPTY);
  }

  stopRive() {
    this.riveInstance?.stop();
  }

  public dispose() {
    if (!this.riveInstance) return;
    this.riveInstance?.cleanup();
  }
};