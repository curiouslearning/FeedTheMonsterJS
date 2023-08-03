import { CanvasStack } from "../utility/canvas-stack";
import { lang } from "../../global-variables";

export function loadImages(sources: any, callback: any) {
  var images = {};
  var loadedImages = 0;
  var numImages = 0;
  // get num of sources
  for (var src in sources) {
    numImages++;
  }
  for (var src in sources) {
    images[src] = new Image();
    images[src].onload = function () {
      if (++loadedImages >= numImages) {
        callback(images);
      }
    };
    images[src].src = sources[src];
  }
}
export function loadingScreen(loading: boolean) {
  const loadingElement = <HTMLElement>document.getElementById("loading-screen");
  const loadingText = <HTMLElement>document.getElementById("loading_text");
  loadingText.style.display = "none";
  if (loading) {
    loadingElement.style.display = "block";
    new CanvasStack("canvas").bkgCanvas.layers.forEach((element) => {
      const htmlElement = <HTMLElement>document.getElementById(element.id);
      htmlElement.style.display = "none";
    });
  } else {
    loadingElement.style.display = "none";
    new CanvasStack("canvas").bkgCanvas.layers.forEach((element) => {
      const htmlElement = <HTMLElement>document.getElementById(element.id);
      htmlElement.style.display = "flex";
    });
  }
}
export const MonsterLayer = "monsterCanvas";
export const TutorialLayer = "tutorialCanvas";
export const PausePopupLayer = "pausepopupCanvas";
export const StoneLayer = "stoneCanvas";
export const TimetickerLayer = "timetickCanvas";
export const LevelEndLayer = "levelEndCanvas";
export const LevelEndButtonsLayer = "levelEndButtonsCanvas";
export const LevelSelectionLayer = "levelSelectionCanvas";
export const LevelStartLayer = "levelStartCanvas";
export const StartSceneLayer = "startSceneCanvas";
export const PlayButtonLayer = "playButtonCanvas";
export const GameEndLayer = "GameEndCanvas";
export const FirebaseUserClicked = "user_clicked";
export const FirebaseUserInstall = "user_installed";
export const PromptTextLayer = "promptTextCanvas";
export const PWAInstallStatus = "pwa_installed_status";
export const UserCancelled = "user_cancel_installation";
export const NativePlayButton = "native_playbutton_clicked";
export const PreviousPlayedLevel = "storePreviousPlayedLevel";
export const StoreMonsterPhaseNumber = "storeMonsterPhaseNumber";
export const IsCached = "is_cached";
export const MonsterAudio = "monster_audio";
export const FeedbackAudio = "feedback_audio";
export const IntroMusic = "intro_music";
export const PromptAudio = "prompt_audio";
export const ButtonClick = "button_click";
export const TimeOver = "time_over";
export const StoneMusic = "stone_music";
export const PhraseAudio = "phrase_audio";
export const LevelEndAudio = "level_end_audio";
export const UrlSubstring = "/feedthemonster";
export const DevelopmentServer = "https://feedthemonsterdev.curiouscontent.org";
export const StartScene1 = "StartScene1";
export const LevelSelection1 = "LevelSelection1";
export const GameScene1 = "GameScene1";
export const EndScene1 = "EndScene1";
