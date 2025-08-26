import {
  StartScene,
  LevelSelectionScreen,
  GameplayScene,
  LoadingScene,
  LevelEndScene,
} from "@scenes";
import { DataModal } from "@data";
import { Debugger, lang, pseudoId } from "@common";
import {
  SCENE_NAME_START,
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_GAME_PLAY_REPLAY,
  SCENE_NAME_LEVEL_END,
  PWAInstallStatus,
  PreviousPlayedLevel,
} from "@constants";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import miniGameStateService from '@miniGameStateService';
import { FeatureFlagsService} from '@curiouslearning/features';
import { FEATURE_QUICK_START } from '../services/features/constants';

const featureFlagService = new FeatureFlagsService({
  metaData: { userId: pseudoId }
});
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
  private currentScene: null | string;

  constructor(data: DataModal) {
    gameStateService.setDefaultGameStateValues(data);
    this.activeScene = {};
    this.setupUIElements();
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    this.initDefaultScenes();
    this.startAnimationLoop();
    this.currentScene = null;
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.SWITCH_SCENE_EVENT,
      (sceneName: string) => {
        //'isNewScene' is a flag to prevent the double instance of the same scene (fix from FM-532 issue).
        const isNewScene = this.currentScene !== sceneName;
        //isReplayScene - If the scene AGAIN is reply, always allow it as Reply is manual and user triggered.
        const isReplayScene = sceneName === SCENE_NAME_GAME_PLAY_REPLAY;

        if (!this.currentScene || isNewScene || isReplayScene) {
          this.currentScene = sceneName;
          this.handleSwitchScene(sceneName);
        }
      }
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

    gameStateService.subscribe(gameStateService.EVENTS.START_GAME, (data) => {
      if (featureFlagService.isFeatureEnabled(FEATURE_QUICK_START)) {
        // recreate data needed for gameplay scene
        const level = localStorage.getItem(PreviousPlayedLevel + lang) || 0;

        const data = gameStateService.data;
        // TODO: this should really be in the gameplay state. Maybe create a LevelState that is managed by gameplaystate.
        const gamePlayData = {
          currentLevelData: {
            ...data.levels[level],
            levelNumber: level,
          },
          selectedLevelNumber: level,
        };
        
        gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, gamePlayData);
        gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_GAME_PLAY);
      } else {
        gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_SELECT);
      }
    });
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

  /*
   * Clean up scene-handler instances and active scene.
   */
  public dispose() {
    this.cleanupScene();
    this.unsubscribeEvent && this.unsubscribeEvent();
    window.removeEventListener(
      "beforeinstallprompt",
      this.handleInstallPrompt,
      false
    );
  }

  private cleanupScene() {
    this.activeScene['scene'] && this.activeScene['scene']?.dispose();
  }

  private gotoScene(sceneName: string) {
    this.cleanupScene();
    this.activeScene['scene'] = this.getScene(sceneName);
  }


  private getScene(sceneName) {
    switch (sceneName) {
      case SCENE_NAME_START:
        return new StartScene();
      case SCENE_NAME_LEVEL_SELECT:
        return new LevelSelectionScreen();
      case SCENE_NAME_GAME_PLAY:
      case SCENE_NAME_GAME_PLAY_REPLAY:
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

    // Check if the active scene exists and is not a LevelEndScene or StartScene
    if (this.activeScene['scene'] && !(
      this.activeScene['scene'] instanceof LevelEndScene
      || this.activeScene['scene'] instanceof StartScene
    )) {
      this.activeScene['scene']?.draw(deltaTime);
    }
  };

  private handleInstallPrompt = (event: Event) => {
    //currently not in use
    event.preventDefault();
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
