import { PubSub } from '../events/pub-sub-events';
import { GameData } from './game-data';
import { DataModal } from "@data";
import { createGameplaySceneDAO } from './data-access-objects';
import {
    SCENE_NAME_START,
    SCENE_NAME_LEVEL_SELECT,
    SCENE_NAME_GAME_PLAY,
    SCENE_NAME_LEVEL_END,
} from '@constants';

export class GameStateService extends PubSub {
    private gameData: any;

    constructor() {
        super();
        this.gameData = new GameData();
        this.gameStateSetSceneListener = this.gameStateSetSceneListener.bind(this);
        this.gameStateGamePlayDataListener = this.gameStateGamePlayDataListener.bind(this);
        this.updateGamePauseActivity = this.updateGamePauseActivity.bind(this);
        this.initListeners();
    }

    private initListeners() {
        /* Listeners to update game state values. */
        this.subscribe(this.EVENTS.SCENE_NAME_EVENT, this.gameStateSetSceneListener);
        this.subscribe(this.EVENTS.GAMEPLAY_DATA_EVENT, this.gameStateGamePlayDataListener);
        this.subscribe(this.EVENTS.GAME_PAUSE_STATUS_EVENT, this.updateGamePauseActivity);
    }

    private gameStateSetSceneListener(nextScene: string) {
        //TO DO
        //Note: This is not properly hooked up as handling the states for scenes are quite big.
        // this.gameData.currentScene = nextScene;

        // if (nextScene === SCENE_NAME_LEVEL_SELECT) {
        //     this.gameData.previousScene = SCENE_NAME_START;

        //     // To Do - Scenario is FROM GAME PLAY TO SCENE_NAME_LEVEL_SELECT

        // } else if (nextScene === SCENE_NAME_GAME_PLAY) {
        //     this.gameData.previousScene = SCENE_NAME_LEVEL_SELECT
        // } else if (nextScene === SCENE_NAME_LEVEL_END) {
        //     this.gameData.previousScene = SCENE_NAME_GAME_PLAY;
        // } // To Do - Add the other logic here when switching scenes from end level

        // const scenes = {
        //     currentScene: this.gameData.currentScene,
        //     previousScene: this.gameData.previousScene
        // }
        // this.notifySubscribers(UPDATED_CURRENT_SCENE_EVENT, scenes);
    }

    private gameStateGamePlayDataListener(gamePlayData) {
        //Updated gamePlayData comes from level-selection and level-end scene.
        this.gameData.gamePlayData = gamePlayData;
    }

    private updateGamePauseActivity(isPaused: boolean) {
        this.gameData.isGamePaused = isPaused;
    }

    setDefaultGameStateValues(
        data: DataModal,
        canvas: HTMLCanvasElement,
        canavsElement: HTMLCanvasElement
    ) {
        //Original game data from FeedTheMonster.ts.
        this.gameData.data = data;
        //HTML and Canvas state values.
        this.gameData.canvas = canvas;
        this.gameData.width = canvas.width;
        this.gameData.height = canvas.height;
        this.gameData.canavsElement = canavsElement;
        this.gameData.context = canavsElement.getContext("2d");
        this.gameData.gameCanvasContext = canvas.getContext("2d", { willReadFrequently: true });
        //Game state values - Scene Handler Data - To Do Add Below Here
        //Game state values - Start Scene Data - To Do Add Below Here
        //Game state values - Level Selection Scene Data - To Do Add Below Here
        /* Game state values - Gameplay Scene Data */
        this.gameData.feedbackTexts = data.FeedbackTexts;
        this.gameData.feedbackAudios = data.FeedbackAudios;
        this.gameData.rightToLeft = data.rightToLeft;
        this.gameData.majVersion = data.majVersion;
        this.gameData.minVersion = data.minVersion;
        //Game state values - Level End Scene Data - To Do Add Below Here
    }

    getGamePlayDAO() {
        return createGameplaySceneDAO(this.gameData);
    }
};

const gameStateServiceInstance = new GameStateService();

export default gameStateServiceInstance;