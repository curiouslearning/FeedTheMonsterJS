import {
  SCENE_NAME_START,
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_LEVEL_END,
  PWAInstallStatus,
  StartScene1,
  LevelSelection1,
  GameScene1,
  EndScene1,
} from "@constants";

export class GameData {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    canavsElement: HTMLCanvasElement;
    gameCanvasContext: CanvasRenderingContext2D;
    isGamePaused: boolean;
    currentScene: string;
    gamePlayData: any //to do
    feedbackTexts: {
        amazing: " Amazing!",
        fantastic: "Fantastic!",
        great: " Great!"
    };
    rightToLeft: boolean;
    majVersion:number;
    minVersion: number;
    feedbackAudios: {
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

    constructor(data, canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
        this.gameCanvasContext = this.canvas.getContext("2d", { willReadFrequently: true });
        this.isGamePaused = false;
        this.currentScene = StartScene1;
        this.gamePlayData = {};
        this.feedbackTexts = data.FeedbackTexts;
        this.rightToLeft = data.rightToLeft;
        this.majVersion = data.majVersion;
        this.minVersion = data.minVersion;
        this.feedbackAudios = data.FeedbackAudios;
    }
};