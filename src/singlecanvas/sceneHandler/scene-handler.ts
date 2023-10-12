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
import { LoadingScene } from "../scenes/loading-scene";
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
  public loadingScreen: LoadingScene;
  public loading: boolean = false;
  public preLoadAudio:any;
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
    console.log(this.data.FeedbackAudios);
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
    this.preLoadAudio= this.preloadAudios(data);
    this.loadingScreen = new LoadingScene(this.width, this.height,this.removeLoading);

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

  preloadAudios(data){
   
    let uniqueUrls=[];
    for(let level of data.levels){
     
      for(let puzzle of level.puzzles ){
          if(!uniqueUrls.includes(puzzle.prompt.promptAudio)){
              uniqueUrls.push(puzzle.prompt.promptAudio);
          }
      }
  }
  this.loadUniqueUrls(uniqueUrls);
  }
  loadUniqueUrls(uniqueUrls){
    let audioContext = new AudioContext();
  let audioBuffers = {};
    let loadPromises = uniqueUrls.map((url) => this.loadAudio(url,audioContext,audioBuffers).catch((err) => {}));
    Promise.all(loadPromises).then(() => {
// You can now use the audioBuffers object to play the preloaded audio files
});
}
loadAudio(url,audioContext,audioBuffers) {
  return new Promise<void>((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
      audioContext.decodeAudioData(request.response, function (buffer) {
        audioBuffers[url] = buffer;
        resolve();
      });
    };
    request.onerror = function () {
      reject(new Error("Error loading audio file"));
    };
    request.send();
  });
}

  animation = (timeStamp) => {
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    this.context.clearRect(0, 0, this.width, this.height);
    if (SceneHandler.SceneName == StartScene1) {
      this.startScene.animation(deltaTime);
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
    } else if (SceneHandler.SceneName == LevelSelection1) {
      // this.levelSelectionScene.draw(1);
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
      this.levelSelectionScene.testDraw();
      // this.levelSelectionScene.testDraw();
    } else if (SceneHandler.SceneName == GameScene1) {
      // render gameplay screen for now
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
      this.gameplayScene.draw(deltaTime);
      // this.testGameplayScene.animation(deltaTime);
    } else if (SceneHandler.SceneName == EndScene1) {
      // render gameplay screen for now
      // this.gameplayScene.draw(deltaTime);
      // console.log('Move to levelend scene');
      this.loading ? this.loadingScreen.draw(deltaTime) : null;
      this.levelEndScene.draw(deltaTime);
      // this.testGameplayScene.animation(deltaTime);
    }
    requestAnimationFrame(this.animation);
  };

  switchSceneToGameplay = (gamePlayData, changeSceneRequestFrom?: string) => {
    this.showLoading();
    this.dispose(changeSceneRequestFrom, "GamePlay");
    let jsonVersionNumber= !!this.data.majVersion && !!this.data.minVersion  ? this.data.majVersion.toString() +"."+this.data.minVersion.toString() : "";
    // load in next scene --- gameplaqyscene
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
    currentlevelPlayed,
    starCount: number,
    monsterPhaseNumber: number,
    currentLevelNumber,
    isTimerEnded:boolean,
  ) => {
    console.log(" currentlevelPlayed: ", currentlevelPlayed);
    this.loadingScreen.initCloud();
    var self = this;
    function createEndLevelScene(){
      self.gameplayScene.dispose();
      document.getElementById("feedback-text").style.zIndex = "0";
      self.levelEndScene = new LevelEndScene(
        self.canvas,
        self.height,
        self.width,
        self.context,
        starCount,
        currentLevelNumber,
        self.switchSceneToGameplay,
        self.switchSceneToLevelSelection,
        self.data,
        monsterPhaseNumber
      );
      SceneHandler.SceneName = EndScene1;
  }
    if(isTimerEnded){
      createEndLevelScene();
    }else{
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
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    document.getElementById("loading").style.zIndex = "-1";
    this.loading = false;
  };
}