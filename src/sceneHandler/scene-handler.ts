import {
  StartScene,
  LevelSelectionScreen,
  GameplayScene,
  LoadingScene,
  LevelEndScene,
} from "@scenes";
import { DataModal } from "@data";
import { Debugger } from "@common";
import {
  SCENE_NAME_START,
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_LEVEL_END,
  PWAInstallStatus,
} from "@constants";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';

export class SceneHandler {
  private activeScene: {
    loading?: null | LoadingScene,
    scene?: null | StartScene | LevelSelectionScreen | GameplayScene | LevelEndScene
  };
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
    this.activeScene = {};
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
    this.activeScene['loading'] = new LoadingScene();
    this.gotoScene(SCENE_NAME_START);
  }

  private handleSwitchScene(sceneName: string) {
    if (sceneName !== SCENE_NAME_LEVEL_END) {
      //No Cloud loading scene for TRANSITIONING TO level-end scene.
      this.activeScene['loading'].toggleLoadingScreen(true);
    }

    this.timerWrapper(() => {
      if (sceneName !== SCENE_NAME_GAME_PLAY) {
        this.gameControl.style.zIndex = "-1";
      }

      this.gotoScene(sceneName);
    });
  }

  private gotoScene(sceneName: string) {
    this.activeScene['scene'] && this.activeScene['scene']?.dispose();
    this.activeScene['scene'] = this.getScene(sceneName);
  }


  private getScene(sceneName) {
    switch (sceneName) {
      case SCENE_NAME_START:
        return new StartScene();
      case SCENE_NAME_LEVEL_SELECT:
        return new LevelSelectionScreen();
      case SCENE_NAME_GAME_PLAY:
        return new GameplayScene();
      case SCENE_NAME_LEVEL_END:
        return new LevelEndScene();
    }
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

  animation = (timeStamp: number) => {
    const deltaTime = timeStamp - this.lastTime;
    this.lastTime = timeStamp;
    this.context.clearRect(0, 0, this.width, this.height);
    this.activeScene['loading'].draw(deltaTime);

    this.activeScene['scene'] && !(
      this.activeScene['scene'] instanceof LevelEndScene
      || this.activeScene['scene'] instanceof StartScene
    ) && this.activeScene['scene']?.draw(deltaTime);
  };

  private handleInstallPrompt = (event: Event) => {
    //currently not in use
    event.preventDefault();
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
