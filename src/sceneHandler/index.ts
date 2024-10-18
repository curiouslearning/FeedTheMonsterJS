import {
  StartScene,
  LevelSelectionScreen,
  GameplayScene,
  LoadingScene,
  LevelEndScene,
} from "@scenes";
import { DataModal, GameScore } from "@data";
import { Debugger } from "@common";
import {
  SCENE_NAME_START,
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_LEVEL_END,
  PWAInstallStatus,
  UPDATED_CURRENT_SCENE_EVENT
} from "@constants";
import gameState from '@gameState';

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
  private toggleBtn: HTMLElement;
  private titleTextElement: HTMLElement;

  constructor(canvas: HTMLCanvasElement, data: DataModal) {
    gameState.setDefaultGameStateValues(
      data,
      canvas,
      document.getElementById("canvas") as HTMLCanvasElement
    );
    this.canvas = canvas;
    this.data = data;
    console.log('data ', data)
    this.width = canvas.width;
    this.height = canvas.height;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
    this.titleTextElement = document.getElementById("title") as HTMLElement;
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    this.context = this.canavsElement.getContext("2d");
    this.startScene = new StartScene(
      canvas,
      data,
      this.switchSceneToLevelSelection
    );
    SceneHandler.SceneName = SCENE_NAME_START;
    this.loadingScreen = new LoadingScene(
      this.width,
      this.height,
      this.removeLoading
    );
    this.startAnimationLoop();
    gameState.subscribe(UPDATED_CURRENT_SCENE_EVENT, this.sceneNameListener.bind(this));
  }

  sceneNameListener(nextScene:string) {
    console.log('sceneNameListener nextScene ', nextScene);
    SceneHandler.SceneName = nextScene;
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
    this.loading ? this.loadingScreen.draw(deltaTime) : null;

    if (SceneHandler.SceneName === SCENE_NAME_START) {
      this.startScene.animation(deltaTime);
    } else if (SceneHandler.SceneName === SCENE_NAME_LEVEL_SELECT) {
      this.levelSelectionScene.drawLevelSelection();
    } else if (SceneHandler.SceneName === SCENE_NAME_GAME_PLAY) {
      this.gameplayScene.draw(deltaTime);
    } else if (SceneHandler.SceneName === SCENE_NAME_LEVEL_END) {
      this.levelEndScene.draw(deltaTime);
    }
  };

  switchSceneToGameplay = (changeSceneRequestFrom?: string) => {
    const gamePlayDAO = gameState.getGamePlayDAO();
    this.showLoading();
    this.dispose(changeSceneRequestFrom);
    console.log('gamePlayDAO ', gamePlayDAO)
    setTimeout(() => {
      this.gameplayScene = new GameplayScene({
        ...gamePlayDAO,
        monsterPhaseNumber: this.checkMonsterPhaseUpdation(),
        switchSceneToEnd: this.switchSceneToEndLevel,
        switchToLevelSelection: () => {
          this.switchSceneToLevelSelection(SCENE_NAME_GAME_PLAY);
        },
        reloadScene: this.switchSceneToGameplay
      });
      SceneHandler.SceneName = SCENE_NAME_GAME_PLAY;
    }, 800);
  };

  switchSceneToEndLevel = (
    starCount: number,
    monsterPhaseNumber: number,
    currentLevelNumber,
    isTimerEnded: boolean
  ) => {
    this.loadingScreen.initCloud();

    setTimeout(
      () => {
        this.dispose(SCENE_NAME_GAME_PLAY);
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
        SceneHandler.SceneName = SCENE_NAME_LEVEL_END;
      },
      isTimerEnded ? 0 : 4000
    );
  };

  switchSceneToLevelSelection = (changeSceneRequestFrom?: string) => {
    this.showLoading();
    this.dispose(changeSceneRequestFrom);
    setTimeout(() => {
      this.levelSelectionScene = new LevelSelectionScreen(
        this.canvas,
        this.data,
        this.switchSceneToGameplay
      );
      SceneHandler.SceneName = SCENE_NAME_LEVEL_SELECT;
      this.titleTextElement.style.display = "none";
    }, 800);
  };

  private dispose = (lastSceneName: string): void => {
    if (lastSceneName == SCENE_NAME_LEVEL_SELECT) {
      this.levelSelectionScene.dispose();
    } else if (lastSceneName === SCENE_NAME_GAME_PLAY) {
      this.gameplayScene.dispose();
    } else if (lastSceneName === SCENE_NAME_START) {
      this.startScene.dispose();
    } else if (lastSceneName == SCENE_NAME_LEVEL_END) {
      this.levelEndScene.dispose();
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
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
