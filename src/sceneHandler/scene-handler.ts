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
  LOADING_TRANSITION,
  SCENE_NAME_START,
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_LEVEL_END,
  PWAInstallStatus,
} from "@constants";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';

export class SceneHandler {
  private scenes: {
    LOADING_TRANSITION?: LoadingScene;
    SCENE_NAME_START?: StartScene;
    SCENE_NAME_LEVEL_SELECT?: LevelSelectionScreen;
    SCENE_NAME_GAME_PLAY?: GameplayScene;
    SCENE_NAME_LEVEL_END?: LevelEndScene;
  };
  private activeScene: null | StartScene | LevelSelectionScreen | GameplayScene | LevelEndScene;
  public data: DataModal;
  public width: number;
  public height: number;
  public context: CanvasRenderingContext2D;
  public gameControl: HTMLCanvasElement;
  private lastTime: number = 0;
  private toggleBtn: HTMLElement;
  private unsubscribeEvent: () => void;

  constructor(data: DataModal) {
    gameStateService.setDefaultGameStateValues(data);
    this.scenes = {};
    this.activeScene = null;
    this.setupUIElements();
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    this.initDefaultScenes();
    this.startAnimationLoop();
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.SWITCH_SCENE_EVENT,
      (sceneName: string) => { this.handleSwitchScene(sceneName); }
    );
  }

  private setupUIElements() {
    const {
      canvasWidth,
      canvasHeight,
      context,
      gameControlElem
    } = gameSettingsService.getCanvasSizeValues();
    this.width = canvasWidth; //Used for Canvas clearRect animation.
    this.height = canvasHeight; //Used for Canvas clearRect animation.
    this.context = context; //Used for Canvas clearRect animation.
    this.gameControl = gameControlElem;
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
  }

  private initDefaultScenes() {
    this.addScene(LOADING_TRANSITION, new LoadingScene());
    this.addScene(SCENE_NAME_START, new StartScene());
    this.gotoScene(SCENE_NAME_START);
  }

  private handleSwitchScene(sceneName: string) {
    if (sceneName !== SCENE_NAME_LEVEL_END) {
      //No Cloud loading scene for TRANSITIONING TO level-end scene.
      this.scenes[LOADING_TRANSITION].toggleLoadingScreen(true);
    }

    this.timerWrapper(() => {
      if (sceneName !== SCENE_NAME_GAME_PLAY) {
        this.gameControl.style.zIndex = "-1";
      }
      this.registerScenes(sceneName);
      this.gotoScene(sceneName);
    });
  }

  private registerScenes(sceneName) {
    switch (sceneName) {
      case SCENE_NAME_LEVEL_SELECT:
        this.addScene(SCENE_NAME_LEVEL_SELECT, new LevelSelectionScreen());
        break;
      case SCENE_NAME_GAME_PLAY:
        this.addScene(SCENE_NAME_GAME_PLAY, new GameplayScene());
        break;
      case SCENE_NAME_LEVEL_END:
        this.addScene(
          SCENE_NAME_LEVEL_END,
          new LevelEndScene(
            this.checkMonsterPhaseUpdation(), //This is WIP on FM-382, I will address this once I pulled FM-382 branch.
          )
        );
        break;
    }
  }

  private addScene(key: string, Class: LoadingScene | StartScene | LevelSelectionScreen | GameplayScene | LevelEndScene) {
    this.scenes[key] = Class;
  }

  private gotoScene(key: string) {
    this.activeScene && this.activeScene?.dispose();
    this.activeScene = this.scenes[key];
  }

  private timerWrapper = (callback: () => void, customTime:number = 800) => {
    //This is for reusable setTimeout with default 800 miliseconds.
    setTimeout(() => { callback(); }, customTime);
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
    const totalStarCount = GameScore.getTotalStarCount();
    if (totalStarCount >= 38) {
      return 4; // Phase 4
    } else if (totalStarCount >= 8) {
      return 2; // Phase 2
    } else {
      return 1; // Phase 1 (default)
    }
  }

  animation = (timeStamp: number) => {
    const deltaTime = timeStamp - this.lastTime;
    this.lastTime = timeStamp;
    this.context.clearRect(0, 0, this.width, this.height);
    this.scenes[LOADING_TRANSITION].draw(deltaTime);

    this.activeScene && !(
      this.activeScene instanceof LevelEndScene
      || this.activeScene instanceof StartScene
    ) && this.activeScene.draw(deltaTime);
  };

  private handleInstallPrompt = (event: Event) => {
    //currently not in use
    event.preventDefault();
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
