import { CACHED_RIVE_WASM } from '@constants';
import { SCENE_NAME_LEVEL_END } from "@constants";
import { RuntimeLoader } from '@rive-app/canvas';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import { JarRiveAnimation } from '../../components/jarRiveAnimation/jar-rive-animation';
//For handling rive in offline mode.
RuntimeLoader.setWasmUrl(CACHED_RIVE_WASM);

export class ProgressionScene {
  public static readonly END_JAR_EVENT: string = "END_JAR_EVENT";

  private riveMonsterElement: HTMLCanvasElement;
  private jarAnimation: JarRiveAnimation;
  private delaySwitchToLevelend: number = 1000;
  private previousTotalStarCount: number = 0;
  private currentLevelStarEarned: number = 0;
  private treasureChestScore: number = 0;
  private previousLevelStarEarned: number = 0;
  private targetStarCountMaxFill: number = 0;
  private isPassingScore: boolean = false;
  private previousJarFillValue: number = 0;
  private targetJarFillValue: number = 0;
  private bonusJarFillValue: number = 0;
  constructor() {
    const riveMonsterElement = gameSettingsService.getRiveCanvasValue();
    this.riveMonsterElement = riveMonsterElement;
    this.initializeValues();
    this.toggleCanvasBackground(true);
    this.initializeRive();
    this.initListeners();
    
  }

  private initListeners(): void {
    gameStateService.subscribe(
      ProgressionScene.END_JAR_EVENT,
      this.scheduleSceneTransition.bind(this)
    );
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

    

    const newScoreEarned = this.isPassingScore
      ? (this.currentLevelStarEarned - this.previousLevelStarEarned)
      : 0;

    // Determine the jar’s previous fill percentage.
    this.previousJarFillValue = this.getStarPercentage(
      this.previousTotalStarCount,
      this.targetStarCountMaxFill
    );

    // Determine the jar’s new target fill percentage.
    this.targetJarFillValue = this.getStarPercentage(
      this.previousTotalStarCount + newScoreEarned,
      this.targetStarCountMaxFill
    );

    this.bonusJarFillValue = this.getStarPercentage(
      this.previousTotalStarCount + newScoreEarned + this.treasureChestScore,
      this.targetStarCountMaxFill
    );   
  }

  private toggleCanvasBackground(isBlack: boolean): void {
    this.riveMonsterElement.style.backgroundColor = isBlack ? '#000' : '';
  }

  private initializeRive(): void {
    this.jarAnimation = new JarRiveAnimation(
      this.riveMonsterElement,
      this.previousJarFillValue,
      this.targetJarFillValue,
      this.bonusJarFillValue,
      this.currentLevelStarEarned + this.treasureChestScore
    );
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
    const maxJarFill = 100; //Hard cap on the rive file.

    return Math.round((starsCount / targetStarCount) * maxJarFill);
  }

  private scheduleSceneTransition(): void {
    setTimeout(() => {
      // stop the state machine before switching scenes
      this.jarAnimation.stopRive();

      // Notify the scene handler to clean up this class and load the Level End scene.
      gameStateService.publish(
        gameStateService.EVENTS.SWITCH_SCENE_EVENT,
        SCENE_NAME_LEVEL_END
      );
    }, this.delaySwitchToLevelend);
  }

  public draw(): void {
    //No need to add draw but required as to how scene classes are structured.
  }

  public dispose(): void {
    if (!this.jarAnimation) return;
    this.toggleCanvasBackground(false);
    this.jarAnimation?.dispose();
  }
};