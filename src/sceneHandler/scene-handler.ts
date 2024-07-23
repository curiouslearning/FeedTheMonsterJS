import {
  PWAInstallStatus,
  StartScene1,
  LevelSelection1,
  GameScene1,
  EndScene1,
} from "../common/common";
import { StartScene } from "../scenes/start-scene";
import { DataModal } from "../data/data-modal";
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
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public static SceneName: string;
  public loadingScreen: LoadingScene;
  public loading: boolean = false;

  private lastTime: number = 0;
  private pwa_install_status: Event;
  private toggleBtn: HTMLElement;

  constructor(
    canvas: HTMLCanvasElement,
    data: DataModal,
  ) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.toggleBtn = document.getElementById("this.toggleBtn") as HTMLElement;
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    this.context = this.canavsElement.getContext("2d");
    this.startScene = new StartScene(
      canvas,
      data,
      this.switchSceneToLevelSelection
    );

    SceneHandler.SceneName = StartScene1;
    this.loadingScreen = new LoadingScene(this.width, this.height,this.removeLoading);
    this.startAnimationLoop();
  }

  startAnimationLoop() {
    const animate = (timeStamp: number) => {
      this.animation(timeStamp);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

  }

  devToggle() {
    this.toggleBtn.addEventListener("click", () => {
      this.toggleBtn.classList.toggle("on");

      if (this.toggleBtn.classList.contains("on")) {
        Debugger.DebugMode = true;
        this.toggleBtn.innerText = "Dev";
      } else {
        Debugger.DebugMode = false;
        this.toggleBtn.innerText = "Dev";
      }
    });
  }

  public checkMonsterPhaseUpdation(): number {
    let totalStarCount = GameScore.getTotalStarCount();
    let monsterPhaseNumber = Math.floor(totalStarCount / 12) + 1 || 1;
    return monsterPhaseNumber <= 4 ? monsterPhaseNumber : 4;
  }

  animation = (timeStamp: number) => {
    let deltaTime = timeStamp - this.lastTime;
    this.lastTime = timeStamp;

    this.context.clearRect(0, 0, this.width, this.height);
    if (SceneHandler.SceneName == StartScene1) {
      this.startScene.animation(deltaTime);
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
    } else if (SceneHandler.SceneName == LevelSelection1) {
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
      this.levelSelectionScene.drawLevelSelection();
    } else if (SceneHandler.SceneName == GameScene1) {
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
      this.gameplayScene.draw(deltaTime);
    } else if (SceneHandler.SceneName == EndScene1) {
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
      this.levelEndScene.draw(deltaTime);
    }
  };

  switchSceneToGameplay = (gamePlayData, changeSceneRequestFrom?: string) => {
    this.showLoading();
    this.dispose(changeSceneRequestFrom, "GamePlay");
    let jsonVersionNumber= !!this.data.majVersion && !!this.data.minVersion ? this.data.majVersion.toString() + "." + this.data.minVersion.toString() : "";
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

  switchSceneToEndLevel = (
    starCount: number,
    monsterPhaseNumber: number,
    currentLevelNumber,
    isTimerEnded: boolean,
  ) => {
    this.loadingScreen.initCloud();
    function createEndLevelScene() {
      this.gameplayScene.dispose();
      document.getElementById("feedback-text").style.zIndex = "0";
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
    }
    if (isTimerEnded) {
      createEndLevelScene();
    } else {
      setTimeout(() => {
        createEndLevelScene();
      }, 4000);
    }
  };

  switchSceneToLevelSelection = (changeSceneRequestFrom?: string) => {
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

  private dispose = (lastSceneName: string, nextSceneName: string): void => {
    if (lastSceneName == "LevelSelection" && nextSceneName == "GamePlay") {
      this.levelSelectionScene.dispose();
      return;
    }
    if (lastSceneName == "GamePlay" && nextSceneName == "GamePlay") {
      this.gameplayScene.dispose();
      return;
    }
    if (lastSceneName == "GamePlay" && nextSceneName == "LevelSelection") {
      this.gameplayScene.dispose();
      return;
    }
    if (lastSceneName == "StartScene" && nextSceneName == "LevelSelection") {
      this.startScene.dispose();
      return;
    }
    if (lastSceneName == "LevelEnd" && nextSceneName == "LevelSelection") {
      this.levelEndScene.dispose();
      return;
    }
    if (lastSceneName == "LevelEnd" && nextSceneName == "GamePlay") {
      this.levelEndScene.dispose();
      return;
    }
  };

  private showLoading = (): void => {
    this.loadingScreen.initCloud();
    this.loading = true;
    document.getElementById("loading").style.zIndex = "3";
  };

  private removeLoading = (): void => {
    document.getElementById("loading").style.zIndex = "-1";
    this.loading = false;
  };

  private handleInstallPrompt = (event: Event) => {
    //currently not in use
    event.preventDefault();
    this.pwa_install_status = event;
    localStorage.setItem(PWAInstallStatus, "false");
  }
}