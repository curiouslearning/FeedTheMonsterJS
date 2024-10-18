import { StateEvents } from '../events/state-events';
import { GameData } from './game-data';
import { DataModal } from "@data";
import { createGameplaySceneDAO } from './dao/gamePlaySceneDAO';
import {
    SCENE_NAME_START,
    SCENE_NAME_LEVEL_SELECT,
    SCENE_NAME_GAME_PLAY,
    SCENE_NAME_LEVEL_END,
    SET_CURRENT_SCENE_EVENT,
    UPDATED_CURRENT_SCENE_EVENT,
    
    SET_GAMEPLAY_DATA_EVENT,
    UPDATED_GAMEPLAY_DATA_EVENT,
    SET_GAME_PAUSE_EVENT,
    UPDATED_GAME_PAUSE_EVENT,
} from '@constants';

export class GameState extends StateEvents {
    private gameData: any;

    constructor() {
        super();
        this.gameData = new GameData();
        this.initListeners();
    }

    private initListeners() {
        //Global listener for any publish event to update game state.
        this.subscribe(SET_CURRENT_SCENE_EVENT, this.gameStateSetSceneListener.bind(this));
        this.subscribe(SET_GAMEPLAY_DATA_EVENT, this.gameStateGamePlayDataListener.bind(this));
        this.subscribe(SET_GAME_PAUSE_EVENT, this.updateGamePauseActivity.bind(this));
    }

    private gameStateSetSceneListener(nextScene: string) {
        //Note: This is not properly hooked up as handling the states for scenes are quite big.
        this.gameData.currentScene = nextScene;

        if (nextScene === SCENE_NAME_LEVEL_SELECT) {
            this.gameData.previousScene = SCENE_NAME_START;

            // To Do - Scenario is FROM GAME PLAY TO SCENE_NAME_LEVEL_SELECT

        } else if (nextScene === SCENE_NAME_GAME_PLAY) {
            this.gameData.previousScene = SCENE_NAME_LEVEL_SELECT
        } else if (nextScene === SCENE_NAME_LEVEL_END) {
            this.gameData.previousScene = SCENE_NAME_GAME_PLAY;
        } // To Do - Add the other logic here when switching scenes from end level

        const scenes = {
            currentScene: this.gameData.currentScene,
            previousScene: this.gameData.previousScene
        }
        this.notifySubscribers(UPDATED_CURRENT_SCENE_EVENT, scenes);
    }

    private gameStateGamePlayDataListener(gamePlayData) {
        //Updated gamePlayData comes from level selection and level end scene.
        this.gameData.gamePlayData = gamePlayData;
        this.notifySubscribers(UPDATED_GAMEPLAY_DATA_EVENT, createGameplaySceneDAO(this.gameData));
    }

    private updateGamePauseActivity(isPaused: boolean) {
        this.gameData.isGamePaused = isPaused;
        this.notifySubscribers(UPDATED_GAME_PAUSE_EVENT, this.gameData.isGamePaused);
    }

    private notifySubscribers(event, data) {
        this.publish(event, data);
    }

    setDefaultGameStateValues(
        data: DataModal,
        canvas: HTMLCanvasElement,
        canavsElement: HTMLCanvasElement
    ) {
        console.log('before this.gameData ', this.gameData)
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
        console.log('after this.gameData ', this.gameData)
    }

    getGamePlayDAO() {
        console.log('this.gameData ', this.gameData)
        return createGameplaySceneDAO(this.gameData);
    }


};

const gameStateInstance = new GameState();

export default gameStateInstance