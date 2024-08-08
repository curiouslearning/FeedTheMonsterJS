import { ImagePaths } from "src/types/commonTypes";

// Audio paths
export const AUDIO_PATH_EATS = "./assets/audios/Eat.mp3";
export const AUDIO_PATH_MONSTER_SPIT = "./assets/audios/MonsterSpit.mp3";
export const AUDIO_PATH_MONSTER_DISSAPOINTED =
  "./assets/audios/Disapointed-05.mp3";
export const AUDIO_PATH_POINTS_ADD = "assets/audios/PointsAdd.wav";
export const AUDIO_PATH_CORRECT_STONE = "assets/audios/CorrectStoneFinal.mp3";
export const AUDIO_PATH_CHEERING_FUNC = (randomNumber: number) =>
  `./assets/audios/Cheering-0${randomNumber}.mp3`;
export const AUDIO_PATH_BTN_CLICK = "./assets/audios/ButtonClick.mp3";
export const AUDIO_PATH_ON_DRAG = "./assets/audios/onDrag.mp3";

// Image paths
export const ASSETS_PATH_STONE_PINK_BG = "./assets/images/stone_pink_v02.png";
export const ASSETS_PATH_TOTEM = "./assets/images/Totem_v02_v01.png";
export const ASSETS_PATH_BG_01 = "./assets/images/bg_v01.jpg";
export const ASSETS_PATH_HILL = "./assets/images/hill_v01.png";
export const ASSETS_PATH_FENCE = "./assets/images/fence_v01.png";
export const ASSETS_PATH_MONSTER_IDLE = "./assets/images/idle4.png";

// Scene names
export const SCENE_NAME_START = "StartScene";
export const SCENE_NAME_LEVEL_SELECT = "LevelSelection";
export const SCENE_NAME_GAME_PLAY = "GamePlay";
export const SCENE_NAME_LEVEL_END = "LevelEnd";

// Image paths for backgrounds
export const images: ImagePaths = {
  bgImg: "./assets/images/bg_v01.jpg",
  hillImg: "./assets/images/hill_v01.png",
  pillerImg: "./assets/images/Totem_v02_v01.png",
  fenchImg: "./assets/images/fence_v01.png",
  autumnBgImg: "./assets/images/Autumn_bg_v01.jpg",
  autumnHillImg: "./assets/images/Autumn_hill_v01.png",
  autumnPillerImg: "./assets/images/Autumn_sign_v01.png",
  autumnSignImg: "./assets/images/Autumn_sign_v01.png",
  autumnFenceImg: "./assets/images/Autumn_fence_v01.png",
  winterBgImg: "./assets/images/Winter_bg_01.jpg",
  winterHillImg: "./assets/images/Winter_hill_v01.png",
  winterSignImg: "./assets/images/Winter_sign_v01.png",
  winterFenceImg: "./assets/images/Winter_fence_v01.png",
  winterPillerImg: "./assets/images/Winter_sign_v01.png",
};
