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

export class SceneHandler {
  private scenes: {
    LOADING_TRANSITION?: LoadingScene;
    SCENE_NAME_START?: StartScene;
    SCENE_NAME_LEVEL_SELECT?: LevelSelectionScreen;
    SCENE_NAME_GAME_PLAY?: GameplayScene;
    SCENE_NAME_LEVEL_END?: LevelEndScene;
  };
  private activeScene: null | StartScene | LevelSelectionScreen | GameplayScene | LevelEndScene;
  public canvas: HTMLCanvasElement; //Remove and use DAO.
  public data: DataModal; //Remove and use DAO.
  public width: number; //Remove and use DAO.
  public height: number; //Remove and use DAO.
  public canavasElement: HTMLCanvasElement; //Remove and use DAO.
  public context: CanvasRenderingContext2D; //Remove and use DAO.
  private lastTime: number = 0;
  private toggleBtn: HTMLElement;
  private titleTextElement: HTMLElement;

  constructor(canvas: HTMLCanvasElement, data: DataModal) {
    gameStateService.setDefaultGameStateValues(
      data,
      canvas,
      document.getElementById("canvas") as HTMLCanvasElement
    );
    this.scenes = {};
    this.activeScene = null;
    /* Remove these and, create and use DAO. */
    this.canvas = canvas; //Create and use DAO.
    this.data = data; //Create and use DAO.
    this.width = canvas.width; //Create and use DAO.
    this.height = canvas.height; //Create and use DAO.
    this.canavasElement = document.getElementById("canvas") as HTMLCanvasElement; //Create and use DAO.
    this.context = this.canavasElement.getContext("2d"); //Create and use DAO.
    /***********************************************************************/
    this.toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
    this.titleTextElement = document.getElementById("title") as HTMLElement;
    window.addEventListener("beforeinstallprompt", this.handleInstallPrompt);
    this.startAnimationLoop();
    this.init(canvas, data);
  }

  private init(canvas: HTMLCanvasElement, data: DataModal) {
    this.addScene(LOADING_TRANSITION, new LoadingScene());
    this.addScene(
      SCENE_NAME_START,
      new StartScene(
        data, //to do - use DAO.
        this.switchSceneToLevelSelection
      )
    );
    this.gotoScene(SCENE_NAME_START);
  }

  private addScene(key: string, Class: LoadingScene | StartScene | LevelSelectionScreen | GameplayScene | LevelEndScene) {
    this.scenes[key] = Class;
  }

  private gotoScene(key: string) {
    this.activeScene && this.activeScene?.dispose();
    this.activeScene = this.scenes[key];
  }

  private timerWrapper = (callback: () => void, customTime: number = 800) => {
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

  // public checkMonsterPhaseUpdation(): number {
  //   const totalStarCount = GameScore.getTotalStarCount();
  //   const monsterPhaseNumber = Math.floor(totalStarCount / 12) + 1 || 1;
  //   return monsterPhaseNumber <= 4 ? monsterPhaseNumber : 4;
  // }

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

  switchSceneToLevelSelection = () => {
    this.timerWrapper(
      () => {
        this.addScene(
          SCENE_NAME_LEVEL_SELECT,
          new LevelSelectionScreen(
            this.canvas, //to do - use DAO.
            this.data, //to do - use DAO.
            this.switchSceneToGameplay
          )
        );
        this.gotoScene(SCENE_NAME_LEVEL_SELECT);
        this.titleTextElement.style.display = "none";
      }
    );
  };

  switchSceneToGameplay = () => {
    this.timerWrapper(
      () => {
        const totalStars = GameScore.getTotalStarCount();
        gameStateService.updateMonsterPhaseBasedOnStars(totalStars); // Update phase
        const updatedPhase = gameStateService.getMonsterPhase(); // Retrieve the current phase

        // Check if the GameplayScene instance exists and has a RiveMonsterComponent
        const gameplayScene = new GameplayScene({
          monsterPhaseNumber: updatedPhase,
          switchSceneToEnd: this.switchSceneToEndLevel,
          switchToLevelSelection: () => {
            this.switchSceneToLevelSelection();
          },
          reloadScene: this.switchSceneToGameplay,
        });

        // Access the RiveMonsterComponent instance and update the source
        if (gameplayScene.monster) {
          gameplayScene.monster.updateSrcByPhase(updatedPhase);
        } else {
          console.error('RiveMonsterComponent is not initialized in GameplayScene.');
        }

        // Add the scene to the handler and navigate to it
        this.addScene(SCENE_NAME_GAME_PLAY, gameplayScene);
        this.gotoScene(SCENE_NAME_GAME_PLAY);
      }
    );
  };

  switchSceneToEndLevel = () => {
    this.timerWrapper(
      () => {
        // Dynamically update the monster phase
        const updatedPhase = gameStateService.getMonsterPhase(); // Get the current phase
        // Initialize the LevelEndScene
    const levelEndScene = new LevelEndScene(
      this.switchSceneToGameplay,
      this.switchSceneToLevelSelection,
      updatedPhase // Pass the dynamic phase
    );

    // Access RiveMonsterComponent if it exists in LevelEndScene
    if (levelEndScene.riveMonster) {
      levelEndScene.riveMonster.updateSrcByPhase(updatedPhase);
    } else {
      console.error('RiveMonsterComponent is not initialized in LevelEndScene.');
    }

    // Add the scene and navigate to it
    this.addScene(SCENE_NAME_LEVEL_END, levelEndScene);
    this.gotoScene(SCENE_NAME_LEVEL_END);
      }
    )
  };

  private handleInstallPrompt = (event: Event) => {
    //currently not in use
    event.preventDefault();
    localStorage.setItem(PWAInstallStatus, "false");
  };
}
