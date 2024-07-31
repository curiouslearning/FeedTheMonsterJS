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

  private lastTime: number = 0;
  private pwaInstallStatus: Event;
  private toggleBtn: HTMLElement;

  constructor(canvas: HTMLCanvasElement, data: DataModal) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.toggleBtn = document.getElementById("toggleBtn") as HTMLElement;
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    this.context = this.canvasElement.getContext("2d")!;
    this.startScene = new StartScene(
      canvas,
      data,
      this.switchSceneToLevelSelection
    );

    SceneHandler.SceneName = StartScene1;
    this.loadingScreen = new LoadingScene(this.width, this.height, this.removeLoading);
    this.animation(0);

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
    const monsterPhaseNumber = Math.min(Math.floor(totalStarCount / 12) + 1, 4);
    return monsterPhaseNumber;
  }

  private animation = (timeStamp: number) => {
    const deltaTime = timeStamp - this.lastTime;
    this.lastTime = timeStamp;

    this.context.clearRect(0, 0, this.width, this.height);
    this.loading && this.loadingScreen.draw(deltaTime);

    switch (SceneHandler.SceneName) {
      case StartScene1:
        this.startScene.animation(deltaTime);
        break;
      case LevelSelection1:
        this.levelSelectionScene.drawLevelSelection();
        break;
      case GameScene1:
        this.gameplayScene.draw(deltaTime);
        break;
      case EndScene1:
        this.levelEndScene.draw(deltaTime);
        break;
    }

    requestAnimationFrame(this.animation);
  };

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
    }, 800);
  };
  
  // this is to switch tp another level after playing the game.
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
      document.getElementById("feedback-text")!.style.zIndex = "0";
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
    };

    isTimerEnded ? createEndLevelScene() : setTimeout(createEndLevelScene, 4000);
  };

  private switchSceneToLevelSelection = (changeSceneRequestFrom?: string) => {
    this.showLoading();
    this.dispose(changeSceneRequestFrom, "LevelSelection");
    setTimeout(() => {
      this.levelSelectionScene = new LevelSelectionScreen(
        this.canvas,
        this.data,
        this.switchSceneToGameplay
      );
      SceneHandler.SceneName = LevelSelection1;
    }, 800);
  };

  private dispose(lastSceneName: string, nextSceneName: string): void {
    const scenes = {
      "LevelSelection": () => this.levelSelectionScene.dispose(),
      "GamePlay": () => this.gameplayScene.dispose(),
      "StartScene": () => this.startScene.dispose(),
      "LevelEnd": () => this.levelEndScene.dispose(),
    };

    scenes[lastSceneName]?.();
  }

  private showLoading = (): void => {
    this.loadingScreen.initCloud();
    this.loading = true;
    document.getElementById("loading")!.style.zIndex = "3";
  };

  private removeLoading = (): void => {
    document.getElementById("loading")!.style.zIndex = "-1";
    this.loading = false;
  };

  private handleInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.pwaInstallStatus = event;
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
