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
export const FONT_BASE_PATH = './assets/fonts/';

//Audio paths
export const AUDIO_PATH_EATS = "./assets/audios/Eat.mp3";
export const AUDIO_PATH_MONSTER_SPIT = "./assets/audios/MonsterSpit.mp3";
export const AUDIO_PATH_MONSTER_DISSAPOINTED =
  "./assets/audios/Disapointed-05.mp3";
export const AUDIO_PATH_POINTS_ADD = "assets/audios/PointsAdd.wav";
export const AUDIO_PATH_CORRECT_STONE = "assets/audios/CorrectStoneFinal.mp3";
export const AUDIO_PATH_CHEERING_FUNC = (randomNumber) =>
  `./assets/audios/Cheering-0${randomNumber}.mp3`;
export const AUDIO_PATH_BTN_CLICK = "./assets/audios/ButtonClick.mp3";
export const AUDIO_PATH_ON_DRAG = "./assets/audios/onDrag.mp3";
export const AUDIO_ARE_YOU_SURE = "./assets/audios/are-you-sure.mp3";
export const AUDIO_TIMEOUT = "./assets/audios/timeout.mp3";
export const AUDIO_INTRO = "./assets/audios/intro.mp3";
export const AUDIO_LEVEL_LOSE = "./assets/audios/LevelLoseFanfare.mp3";
export const AUDIO_LEVEL_WIN = "./assets/audios/LevelWinFanfare.mp3";
export const AUDIO_URL_PRELOAD = [
  "./assets/audios/intro.mp3",
  "./assets/audios/Cheering-02.mp3",
  "./assets/audios/Cheering-03.mp3",
  "./assets/audios/Cheering-01.mp3",
  "./assets/audios/onDrag.mp3",
  "./assets/audios/timeout.mp3",
  "./assets/audios/LevelWinFanfare.mp3",
  "./assets/audios/LevelLoseFanfare.mp3",
  "./assets/audios/ButtonClick.mp3",
  "./assets/audios/Monster Spits wrong stones-01.mp3",
  "./assets/audios/Disapointed-05.mp3",
  "./assets/audios/MonsterSpit.mp3",
  "./assets/audios/Eat.mp3",
  "./assets/audios/PointsAdd.wav",
  "./assets/audios/are-you-sure.mp3",
  './assets/audios/monster_discovered_fanfare.mp3',
  './assets/audios/monster_evolve.mp3'
];
// Audios used during the Rive evolution animation.
// The structure is designed to be easily scalable, allowing for the addition of more audio files as needed.
export const EVOLUTION_AUDIOS = {
  EVOL_1: ['/assets/audios/star_whoosh_and_poof.mp3'],
}

// Evolution audio paths
export const AUDIO_CHEERING = './assets/audios/Cheering-03.mp3';
export const AUDIO_MONSTER_DISCOVERED = './assets/audios/monster_discovered_fanfare.mp3';
export const AUDIO_MONSTER_EVOLVE = './assets/audios/monster_evolve.mp3';

//Image paths
export const ASSETS_PATH_STONE_PINK_BG = "./assets/images/Pink_Stone.svg"; //Updated stone asset
export const ASSETS_PATH_TOTEM = "./assets/images/Totem_v02_v01.webp";
export const ASSETS_PATH_BG_01 = "./assets/images/bg_v01.webp";
export const ASSETS_PATH_HILL = "./assets/images/hill.webp";
export const ASSETS_PATH_FENCE = "./assets/images/fence_v01.webp";
export const ASSETS_PATH_MONSTER_IDLE = "./assets/images/idle4.png";
export const DEFAULT_BACKGROUND_1 = "./assets/images/bg_v01.webp";
export const AUTUMN_BACKGROUND_1 = "./assets/images/Autumn_bg_v01.webp";
export const AUTUMN_HILL_1 = "./assets/images/Autumn_hill.webp";
export const AUTUMN_PILLAR_1 = "./assets/images/Autumn_sign_v01.webp";
export const AUTUMN_SIGN_1 = "./assets/images/Autumn_sign_v01.webp";
export const AUTUMN_FENCE_1 = "./assets/images/Autumn_fence_v01.webp";
export const WINTER_BACKGROUND_1 = "./assets/images/Winter_bg_01.webp";
export const WINTER_HILL_1 = "./assets/images/Winter_hill.webp";
export const WINTER_SIGN_1 = "./assets/images/Winter_sign_v01.webp";
export const WINTER_FENCE_1 = "./assets/images/Winter_fence_v01.webp";
export const WINTER_PILLAR_1 = "./assets/images/Winter_sign_v01.webp";
export const LEVEL_SELECTION_BACKGROUND = "./assets/images/map.webp";
export const PROMPT_TEXT_BG = "./assets/images/Prompt_Text_BG.svg";
export const PROMPT_PLAY_BUTTON = "./assets/images/promptPlayButton.webp";
export const LEVEL_INDICATOR = "./assets/images/levels_v01.svg";
export const BAR_EMPTY = "./assets/images/bar_empty_v01.svg";
export const BAR_FULL = "./assets/images/bar_full_v01.svg";
export const TIMER_EMPTY = "./assets/images/timer_emptynew.webp";
export const ROTATING_CLOCK = "./assets/images/timer_new.svg";
export const TUTORIAL_HAND = "./assets/images/tutorial_hand.webp";
export const WIN_BG = "./assets/images/WIN_screen_bg.webp";
export const PIN_STAR_1 = "./assets/images/pinStar1.svg";
export const PIN_STAR_2 = "./assets/images/pinStar2.svg";
export const PIN_STAR_3 = "./assets/images/pinStar3.svg";
export const CLOUD_6 = "./assets/images/cloud_01.png";
export const CLOUD_7 = "./assets/images/cloud_02.png";
export const CLOUD_8 = "./assets/images/cloud_03.png";

export const PLAY_BTN_IMG = "./assets/images/Play_button.svg";
export const PAUSE_BTN_IMG = "./assets/images/Pause_Button.svg";
export const MAP_BTN_IMG = "./assets/images/map_btn.svg";
export const MAP_ICON_IMG = "./assets/images/mapIcon.webp";
export const MAP_ICON_SPECIAL_IMG =
  "./assets/images/map_icon_monster_level_v01.webp";
export const MAP_LOCK_IMG = "./assets/images/mapLock.webp";
export const STAR_IMG = "./assets/images/star.webp";
export const NEXT_BTN_IMG = "./assets/images/next_btn.svg";
export const BACK_BTN_IMG = "./assets/images/back_btn.svg";
export const RETRY_BTN_IMG = "./assets/images/retry_btn.svg";
export const CANCEL_BTN_IMG = "./assets/images/close_btn.svg";
export const YES_BTN_IMG = "./assets/images/confirm_btn.svg";
export const POPUP_BG_IMG = "./assets/images/popup_bg_v01.svg";

//Background Group Images
// to be removed once background component is fully integrate - GAMEPLAY_BG_GROUP_IMGS, DEFAULT_BG_GROUP_IMGS, AUTUMN_BG_GROUP_IMGS, WINTER_BG_GROUP_IMGS
export const GAMEPLAY_BG_GROUP_IMGS = {
  ASSETS_PATH_TOTEM,
  DEFAULT_BACKGROUND_1,
  ASSETS_PATH_HILL,
  ASSETS_PATH_FENCE,
  ASSETS_PATH_MONSTER_IDLE,
};

export const DEFAULT_BG_GROUP_IMGS = {
  DEFAULT_BACKGROUND_1,
  ASSETS_PATH_HILL,
  ASSETS_PATH_TOTEM,
  ASSETS_PATH_FENCE,
};
export const AUTUMN_BG_GROUP_IMGS = {
  AUTUMN_BACKGROUND_1,
  AUTUMN_HILL_1,
  AUTUMN_PILLAR_1,
  AUTUMN_SIGN_1,
  AUTUMN_FENCE_1,
};
export const WINTER_BG_GROUP_IMGS = {
  WINTER_BACKGROUND_1,
  WINTER_HILL_1,
  WINTER_SIGN_1,
  WINTER_FENCE_1,
  WINTER_PILLAR_1,
};

//Rive Animation
export const MONSTER_PHASES = [
  './assets/rive/phase1Monster.riv',
  './assets/rive/phase2Monster.riv', //Removed 'Updated' in the Rive file and renamed it for Git to detect changes.
  './assets/rive/phase4Monster.riv',
];
export const EVOL_MONSTER = [
  './assets/rive/evolve.riv', // add new files when other evolution files are ready
  './assets/rive/ftm_monster_1_2_evol_v01.riv'
];

export enum MonsterState {
  PHASE = 'phase',
  EVOLUTION = 'evolution',
}
//Scene Names
export const SCENE_NAME_START = "StartScene";
export const SCENE_NAME_LEVEL_SELECT = "LevelSelection";
export const SCENE_NAME_GAME_PLAY = "GamePlay";
export const SCENE_NAME_LEVEL_END = "LevelEnd";

//Levels
export const SPECIAL_LEVELS = [5, 13, 20, 30, 42];

//Evolving Phases Backgrounds
export const PHASES_BG ={
  0: './assets/images/phase_background_1.webp',
  1: './assets/images/phase_background_2.webp',
  2: './assets/images/phase_background_3.webp'
};
