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

//Audio paths
export const AUDIO_PATH_EATS = "./assets/audios/Eat.mp3";
export const AUDIO_PATH_MONSTER_SPIT = "./assets/audios/MonsterSpit.mp3";
export const AUDIO_PATH_MONSTER_DISSAPOINTED = "./assets/audios/Disapointed-05.mp3"
export const AUDIO_PATH_POINTS_ADD = "assets/audios/PointsAdd.wav";
export const AUDIO_PATH_CORRECT_STONE = "assets/audios/CorrectStoneFinal.mp3"
export const AUDIO_PATH_CHEERING_FUNC = (randomNumber) => `./assets/audios/Cheering-0${randomNumber}.mp3`;
export const AUDIO_PATH_BTN_CLICK = "./assets/audios/ButtonClick.mp3"
export const AUDIO_PATH_ON_DRAG = "./assets/audios/onDrag.mp3"

//Image paths
export const ASSETS_PATH_STONE_PINK_BG = "./assets/images/stone_pink.png"; //stone_pink_v02.png
export const ASSETS_PATH_TOTEM = "./assets/images/Totem_v02_v01.png";
export const ASSETS_PATH_BG_01 = "./assets/images/bg_v01.jpg";
export const ASSETS_PATH_HILL = "./assets/images/hill_v01.png";
export const ASSETS_PATH_FENCE = "./assets/images/fence_v01.png";
export const ASSETS_PATH_MONSTER_IDLE = "./assets/images/idle4.png";
export const DEFAULT_BACKGROUND_1 = "./assets/images/bg_v01.jpg";
export const HILL_IMAGE_1 = "./assets/images/hill_v01.png";
export const PILLAR_IMAGE_1 = "./assets/images/Totem_v02_v01.png";
export const FENCE_IMAGE_1 = "./assets/images/fence_v01.png";
export const AUTUMN_BACKGROUND_1 = "./assets/images/Autumn_bg_v01.jpg";
export const AUTUMN_HILL_1 = "./assets/images/Autumn_hill_v01.png";
export const AUTUMN_PILLAR_1 = "./assets/images/Autumn_sign_v01.png";
export const AUTUMN_SIGN_1 = "./assets/images/Autumn_sign_v01.png";
export const AUTUMN_FENCE_1 = "./assets/images/Autumn_fence_v01.png";
export const WINTER_BACKGROUND_1 = "./assets/images/Winter_bg_01.jpg";
export const WINTER_HILL_1 = "./assets/images/Winter_hill_v01.png";
export const WINTER_SIGN_1 = "./assets/images/Winter_sign_v01.png";
export const WINTER_FENCE_1 = "./assets/images/Winter_fence_v01.png";
export const WINTER_PILLAR_1 = "./assets/images/Winter_sign_v01.png";
export const LEVEL_SELECTION_BACKGROUND = "./assets/images/map.jpg";
export const PLAY_BUTTON_IMAGE = "./assets/images/Play_button.png";
export const PAUSE_BUTTON_IMAGE = "./assets/images/pause_v01.png";
export const CLOSE_BUTTON_IMAGE = "./assets/images/map_btn.png";

export const MAP_ICON_IMAGE = "./assets/images/mapIcon.png";
export const MAP_ICON_SPECIAL_IMAGE = "./assets/images/map_icon_monster_level_v01.png";
export const MAP_LOCK_IMAGE = "./assets/images/mapLock.png";
export const STAR_IMAGE = "./assets/images/star.png";
export const NEXT_BTN_IMAGE = "./assets/images/next_btn.png";
export const BACK_BTN_IMAGE = "./assets/images/back_btn.png";
export const RETRY_BTN_IMAGE = "./assets/images/retry_btn.png";
export const CANCEL_BTN_IMAGE = "./assets/images/close_btn.png";
export const YES_BTN_IMAGE = "./assets/images/confirm_btn.png";
export const NO_BTN_IMAGE = "./assets/images/close_btn.png";
export const POPUP_BG_IMAGE = "./assets/images/popup_bg_v01.png";


//Background Group Images
export const GAMEPLAY_BG_GROUP_IMGS = {
    ASSETS_PATH_TOTEM,
    ASSETS_PATH_BG_01,
    ASSETS_PATH_HILL,
    ASSETS_PATH_FENCE,
    ASSETS_PATH_MONSTER_IDLE
};

export const DEFAULT_BG_GROUP_IMGS = {
    DEFAULT_BACKGROUND_1,
    HILL_IMAGE_1,
    PILLAR_IMAGE_1,
    FENCE_IMAGE_1
};
export const AUTUMN_BG_GROUP_IMGS = {
    AUTUMN_BACKGROUND_1,
    AUTUMN_HILL_1,
    AUTUMN_PILLAR_1,
    AUTUMN_SIGN_1,
    AUTUMN_FENCE_1
};
export const WINTER_BG_GROUP_IMGS = {
    WINTER_BACKGROUND_1,
    WINTER_HILL_1,
    WINTER_SIGN_1,
    WINTER_FENCE_1,
    WINTER_PILLAR_1
};

//Scene Names
export const SCENE_NAME_START = "StartScene";
export const SCENE_NAME_LEVEL_SELECT = "LevelSelection";
export const SCENE_NAME_GAME_PLAY = "GamePlay";
export const SCENE_NAME_LEVEL_END = "LevelEnd";
