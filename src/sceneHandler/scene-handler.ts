import {
  PWAInstallStatus,
  StartScene1,
  LevelSelection1,
  GameScene1,
  EndScene1,
} from "../common/common";
import { StartScene } from "../scenes/start-scene";
import { DataModal } from "../data/data-modal";
import { TestGameplayScene } from "../scenes/test-gameplay-scene";
import { LevelSelectionScreen } from "../scenes/level-selection-scene";
import { Debugger } from "../../global-variables";
import { GameplayScene } from "../scenes/gameplay-scene";
import { GameScore } from "../data/game-score";
import { LoadingScene } from "../scenes/loading-scene";
import { LevelEndScene } from "../scenes/levelend-scene";
import { Animation } from "../common/animation";

export class SceneHandler {
  public canvas: HTMLCanvasElement;
  public data: DataModal;
  public width: number;
  public height: number;
  public startScene: StartScene;
  public levelSelectionScene: LevelSelectionScreen;
  public gameplayScene: GameplayScene;
  public levelEndScene: LevelEndScene;
  public testGameplayScene: TestGameplayScene;
  public canvasElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public static SceneName: string;
  public loadingScreen: LoadingScene;
  public loading: boolean = false;

  private pwaInstallStatus: Event;
  private toggleBtn: HTMLElement;
  private feedbackTextElement: HTMLElement;
  private loadingElement: HTMLElement;

  constructor(canvas: HTMLCanvasElement, data: DataModal) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.toggleBtn = document.getElementById("toggleBtn") as HTMLElement;
    this.feedbackTextElement = document.getElementById("feedback-text") as HTMLElement;
    this.loadingElement = document.getElementById("loading") as HTMLElement;
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    this.context = this.canvasElement.getContext("2d")!;
    this.startScene = new StartScene(canvas, data, this.switchSceneToLevelSelection);

    SceneHandler.SceneName = StartScene1;
    this.loadingScreen = new LoadingScene(this.width, this.height, this.removeLoading);

    new Animation(this);
    this.devToggle();
  }

  private devToggle() {
    this.toggleBtn.addEventListener("click", () => {
      this.toggleBtn.classList.toggle("on");
      Debugger.DebugMode = this.toggleBtn.classList.contains("on");
      this.toggleBtn.innerText = "Dev";
    });
  }

  private checkMonsterPhaseUpdation(): number {
    const totalStarCount = GameScore.getTotalStarCount();
    return Math.min(Math.floor(totalStarCount / 12) + 1, 4);
  }

  private switchSceneToGameplay = (gamePlayData: any, changeSceneRequestFrom?: string) => {
    this.showLoading();
    this.dispose(changeSceneRequestFrom, "GamePlay");

    const jsonVersionNumber = this.data.majVersion && this.data.minVersion 
      ? `${this.data.majVersion}.${this.data.minVersion}`
      : "";

    setTimeout(() => {
      this.gameplayScene = new GameplayScene(
        this.canvas,
        gamePlayData.currentLevelData,
        this.checkMonsterPhaseUpdation(),
        this.data.FeedbackTexts,
        this.data.rightToLeft,
        this.switchSceneToEndLevel,
        gamePlayData.selectedLevelNumber,
        this.switchSceneToLevelSelection,
        this.switchSceneToGameplay,
        jsonVersionNumber,
        this.data.FeedbackAudios
      );
      SceneHandler.SceneName = GameScene1;
      this.removeLoading();
    }, 800);
  };

  private switchSceneToEndLevel = (
    currentLevelPlayed: any,
    starCount: number,
    monsterPhaseNumber: number,
    currentLevelNumber: number,
    isTimerEnded: boolean
  ) => {
    console.log("currentLevelPlayed:", currentLevelPlayed);
    this.loadingScreen.initCloud();

    const createEndLevelScene = () => {
      this.gameplayScene.dispose();
      this.feedbackTextElement.style.zIndex = "0";
      this.levelEndScene = new LevelEndScene(
        this.canvas,
        this.height,
        this.width,
        this.context,
        starCount,
        currentLevelNumber,
        this.switchSceneToGameplay,
        this.switchSceneToLevelSelection,
        this.data,
        monsterPhaseNumber
      );
      SceneHandler.SceneName = EndScene1;
      this.removeLoading();
    };

    if (isTimerEnded) {
      createEndLevelScene();
    } else {
      setTimeout(createEndLevelScene, 4000);
    }
  };

  private switchSceneToLevelSelection = (changeSceneRequestFrom?: string) => {
    this.showLoading();
    this.dispose(changeSceneRequestFrom, "LevelSelection");
    setTimeout(() => {
      this.levelSelectionScene = new LevelSelectionScreen(this.canvas, this.data, this.switchSceneToGameplay);
      SceneHandler.SceneName = LevelSelection1;
      this.removeLoading();
    }, 800);
  };

  private dispose(lastSceneName: string, nextSceneName: string): void {
    switch (lastSceneName) {
      case "LevelSelection":
        this.levelSelectionScene.dispose();
        break;
      case "GamePlay":
        this.gameplayScene.dispose();
        break;
      case "StartScene":
        this.startScene.dispose();
        break;
      case "LevelEnd":
        this.levelEndScene.dispose();
        break;
    }
  }

  private showLoading = (): void => {
    this.loadingScreen.initCloud();
    this.loading = true;
    this.loadingElement.style.zIndex = "3";
  };

  private removeLoading = (): void => {
    this.loadingElement.style.zIndex = "-1";
    this.loading = false;
  };

  private handleInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.pwaInstallStatus = event;
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
export { StartScene1, LevelSelection1, GameScene1, EndScene1 };

