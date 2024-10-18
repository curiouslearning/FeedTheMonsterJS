import { DataModal } from "@data";
import { SCENE_NAME_START } from "@constants";

export class GameData {
    public data: null | DataModal;
    public canvas: null | HTMLCanvasElement;
    public width: null | number;
    public height: null | number;
    public canavsElement: null | HTMLCanvasElement;
    public context: null | CanvasRenderingContext2D;
    public gameCanvasContext: null | CanvasRenderingContext2D;
    public isGamePaused: boolean;
    public currentScene: string;
    public previousScene: string;
    public gamePlayData: null | {
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

    };
    public feedbackTexts: null |  {
        amazing: string,
        fantastic: string,
        great: string
    };
    public rightToLeft: boolean;
    public majVersion: null | number;
    public minVersion: null | number;
    public feedbackAudios: null | {
        amazing: string,
        fantastic: string,
        great: string
    };
    public clickTrailToggle: boolean

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
        this.rightToLeft = false;
        this.majVersion = null;
        this.minVersion = null;
        this.clickTrailToggle = false;
    }
};
