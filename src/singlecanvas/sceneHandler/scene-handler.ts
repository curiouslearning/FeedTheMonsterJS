import {
  ButtonClick,
  FirebaseUserClicked,
  PWAInstallStatus,
  StartScene1,
  LevelSelection1,
  GameScene1,
  loadImages,
  EndScene1,
} from "../../common/common";
import { StoneConfig } from "../common/stone-config";
import Sound from "../../common/sound";
import InstallButton from "../../components/buttons/install_button";
import PlayButton from "../../singlecanvas/components/play-button";
import { Monster } from "../components/monster";
import { StartScene } from "../scenes/start-scene";
import { DataModal } from "../../data/data-modal";
import { TestGameplayScene } from "../scenes/test-gameplay-scene";
import { LevelSelectionScreen } from "../scenes/level-selection-scene";
import { Debugger, lang } from "../../../global-variables";
import { GameplayScene } from "../scenes/gameplay-scene";
import { LevelEndScene } from "../scenes/levelend-scene";
import { GameScore } from "../data/game-score";
let lastTime = 0;
let pwa_install_status: any;
const toggleBtn = document.getElementById("toggle-btn") as HTMLElement;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  pwa_install_status = e;
  localStorage.setItem(PWAInstallStatus, "false");
});

export class SceneHandler {
  public canvas: HTMLCanvasElement;
  public data: any;
  public width: number;
  public height: number;
  public startScene: StartScene;
  public levelSelectionScene: any;
  public gameplayScene: GameplayScene;
  public levelEndScene: LevelEndScene;
  public testGameplayScene: TestGameplayScene;
  // public monster: Monster;
  // public pickedStone: StoneConfig;
  // public pwa_status: string;
  // public firebase_analytics: { logEvent: any };
  // public id: string;
  public canavsElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  // public buttonContext: CanvasRenderingContext2D;
  // public outcome: any;
  // public playButton: PlayButton | InstallButton;
  // public levelSelectionScene: any;
  // public images: Object;
  // public loadedImages: any;
  // public imagesLoaded: boolean = false;
  // public handler: any;
  public static SceneName: string;

  constructor(
    canvas: HTMLCanvasElement,
    data: DataModal,
    firebase_analytics: { logEvent: any }
  ) {
    this.canvas = canvas;
    this.data = data;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canavsElement.getContext("2d");
    console.log(this.data.levels[2]);
    this.startScene = new StartScene(
      canvas,
      data,
      firebase_analytics,
      this.switchSceneToLevelSelection
    );
    // this.testGameplayScene = new TestGameplayScene(canvas, data, firebase_analytics, this.switchSceneToLevelSelection);
    // this.gameplayScene = new GameplayScene(this.canvas, this.context, this.data.levels[0], 1, "text", false);
    // this.monster = new Monster(this.canvas);
    // this.pwa_status = localStorage.getItem(PWAInstallStatus);
    // this.handler = document.getElementById("canvas");
    // this.devToggle();
    // this.createPlayButton();
    // this.firebase_analytics = firebase_analytics;
    SceneHandler.SceneName = StartScene1;

    this.animation(0);
  }

  devToggle() {
    toggleBtn.addEventListener("click", () => {
      toggleBtn.classList.toggle("on");

      if (toggleBtn.classList.contains("on")) {
        Debugger.DebugMode = true;
        toggleBtn.innerText = "Dev";
      } else {
        Debugger.DebugMode = false;
        toggleBtn.innerText = "Dev";
      }
    });
  }

  public checkMonsterPhaseUpdation(): number {
    let totalStarCount = GameScore.getTotalStarCount();
    let monsterPhaseNumber = Math.floor(totalStarCount / 12) + 1 || 1;
    return monsterPhaseNumber <= 4 ? monsterPhaseNumber : 4;
  }

  animation = (timeStamp) => {
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    this.context.clearRect(0, 0, this.width, this.height);
    if (SceneHandler.SceneName == StartScene1) {
      this.startScene.animation(deltaTime);
    } else if (SceneHandler.SceneName == LevelSelection1) {
      // this.levelSelectionScene.draw(1);
      this.levelSelectionScene.testDraw();
    } else if (SceneHandler.SceneName == GameScene1) {
      // render gameplay screen for now
      this.gameplayScene.draw(deltaTime);
      // this.testGameplayScene.animation(deltaTime);
    } else if (SceneHandler.SceneName == EndScene1) {
      // render gameplay screen for now
      // this.gameplayScene.draw(deltaTime);
      // console.log('Move to levelend scene');
      this.levelEndScene.draw(deltaTime);
      // this.testGameplayScene.animation(deltaTime);
    }
    requestAnimationFrame(this.animation);
  };

  // draw() {
  // }

  switchSceneToGameplay = (gamePlayData, changeSceneRequestFrom?: string) => {
    this.dispose(changeSceneRequestFrom, "GamePlay");
    // load in next scene --- gameplaqyscene
      this.gameplayScene = new GameplayScene(
        this.canvas,
        gamePlayData.currentLevelData,
        this.checkMonsterPhaseUpdation(),
        this.data.FeedbackTexts,
        this.data.rightToLeft,
        this.switchSceneToEndLevel,
        gamePlayData.selectedLevelNumber,
        this.switchSceneToLevelSelection,
        this.switchSceneToGameplay
      );
      SceneHandler.SceneName = GameScene1;
  };

  switchSceneToEndLevel = (
    currentlevelPlayed,
    starCount: number,
    monsterPhaseNumber: number
  ) => {
    console.log(" currentlevelPlayed: ", currentlevelPlayed);
    setTimeout(() => {
      this.gameplayScene.dispose();
      document.getElementById("feedback-text").style.zIndex = "0";
      this.levelEndScene = new LevelEndScene(
        this.canvas,
        this.height,
        this.width,
        this.context,
        starCount,
        currentlevelPlayed.levelNumber,
        this.switchSceneToGameplay,
        this.switchSceneToLevelSelection,
        this.data,
        monsterPhaseNumber
      );
      SceneHandler.SceneName = EndScene1;
    }, 4000);
  };

  switchSceneToLevelSelection = (changeSceneRequestFrom?: string) => {
    this.dispose(changeSceneRequestFrom, "LevelSelection");
      this.levelSelectionScene = new LevelSelectionScreen(
        this.canvas,
        this.data,
        this.switchSceneToGameplay
      );
      SceneHandler.SceneName = LevelSelection1;
  };

  private dispose = (lastSceneName: string, nextSceneName: string): void => {
    switch (`${lastSceneName}-${nextSceneName}`) {
        case "LevelSelection-GamePlay":
            this.levelSelectionScene.dispose();
            break;
        case "GamePlay-GamePlay":
            this.gameplayScene.dispose();
            break;
        case "GamePlay-LevelSelection":
            this.gameplayScene.dispose();
            break;
        case "StartScene-LevelSelection":
            this.startScene.dispose();
            break;
        case "LevelEnd-LevelSelection":
            this.levelEndScene.dispose();
            break;
        case "LevelEnd-GamePlay":
            this.levelEndScene.dispose();
            break;
        default:
            break;
    }
   }

}
