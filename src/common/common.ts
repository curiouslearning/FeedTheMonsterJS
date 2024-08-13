export function loadImages(sources: any, callback: any) {
  const images = {};
  let loadedImages = 0;
  const numImages = Object.keys(sources).length;

  for (let src in sources) {
    images[src] = new Image();
    images[src].onload = function () {
      if (++loadedImages >= numImages) {
        callback(images);
      }
    };
    images[src].src = sources[src];
  }
}

export const FirebaseUserClicked = "user_clicked";
export const FirebaseUserInstall = "user_installed";
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
