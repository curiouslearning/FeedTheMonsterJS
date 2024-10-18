import { DataModal } from "@data";
import {
  SCENE_NAME_START,
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_LEVEL_END,
  PWAInstallStatus,

} from "@constants";

export class GameData {
    data: null | DataModal;
    canvas: null | HTMLCanvasElement;
    width: null | number;
    height: null | number;
    canavsElement: null | HTMLCanvasElement;
    context: null | CanvasRenderingContext2D;
    gameCanvasContext: null | CanvasRenderingContext2D;
    isGamePaused: boolean;
    currentScene: string;
    previousScene: string;
    gamePlayData: null | {
        currentLevelData: {
            levelMeta: {
                letterGroup: number;
                levelNumber: number;
                levelType: string;
                promptFadeOut: number;
                protoType: string;
            };
            levelNumber: number;
            puzzles: {
                foilStones: string[];
                prompt: {
                    promptAudio: string;
                    promptText: string;
                }
                segmentNumber: number;
                targetStones: string[];
            }[];
        },
        selectedLevelNumber: number

    } //to do
    feedbackTexts: null |  {
        amazing: string,
        fantastic: string,
        great: string
    };
    rightToLeft: null | boolean;
    majVersion: null | number;
    minVersion: null | number;
    feedbackAudios: null | {
        amazing: string,
        fantastic: string,
        great: string
    }
    /*
    levelData: {
        currentLevelData: {
            levelMeta
            levelNumber
            puzzles: []
        },
        selectedLevelNumber: number

    }
    */

    constructor() {
        this.data = null;
        /* Canvas States */
        this.canvas = null;
        this.width = null;
        this.height = null;
        this.canavsElement = null;
        this.context = null;
        this.gameCanvasContext = null;
        /* Scene Handler States */
        this.currentScene = SCENE_NAME_START;
        this.previousScene = '';

        /* Gameplay States */
        this.isGamePaused = false;
        this.gamePlayData = null;
        this.feedbackAudios = null;
        this.feedbackTexts = null;
        this.rightToLeft = null;
        this.majVersion = null;
        this.minVersion = null;
    }
};
