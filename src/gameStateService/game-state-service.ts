import { PubSub } from '../events/pub-sub-events';
import { DataModal } from "@data";
import { createGameplaySceneDAO } from './data-access-objects';
import {
    SCENE_NAME_START,
    SCENE_NAME_LEVEL_SELECT,
    SCENE_NAME_GAME_PLAY,
    SCENE_NAME_LEVEL_END,
} from '@constants';

/**
 * GameStateService.ts
 *
 * The GameStateService class is reponsible to managing the current state of the game (ts).
 * It also provides methods for accessing these properties using a set of getters
 * that returns data access objects (DAO). The class also integrates with the Publish-Subscribe pattern
 * to faciliate event-drivent updates, in the game state.
 */

export class GameStateService extends PubSub {
    public EVENTS: {
        SCENE_NAME_EVENT: string;
        GAMEPLAY_DATA_EVENT: string;
        GAME_PAUSE_STATUS_EVENT: string;
        GAME_TRAIL_EFFECT_TOGGLE_EVENT: string;
    }
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
        super();
        this.EVENTS = {
            SCENE_NAME_EVENT: 'SCENE_NAME_EVENT',
            GAMEPLAY_DATA_EVENT: 'GAMEPLAY_DATA_EVENT',
            GAME_PAUSE_STATUS_EVENT: 'GAME_PAUSE_STATUS_EVENT',
            GAME_TRAIL_EFFECT_TOGGLE_EVENT: 'GAME_TRAIL_EFFECT_TOGGLE_EVENT'
        };
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
        this.initListeners();
    }

    private initListeners() {
        /* Listeners to update game state values. */
        this.subscribe(this.EVENTS.SCENE_NAME_EVENT, (data) => { this.gameStateSetSceneListener(data) });
        this.subscribe(this.EVENTS.GAMEPLAY_DATA_EVENT, (data) => { this.gameStateGamePlayDataListener(data) });
        this.subscribe(this.EVENTS.GAME_PAUSE_STATUS_EVENT, (data) => { this.updateGamePauseActivity(data) });
        this.subscribe(this.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT, (data) => { this.updateGameTrailToggle(data) })
    }

    private gameStateSetSceneListener(nextScene: string) {
        //TO DO
        //Note: This is not properly hooked up as handling the states for scenes are quite big.
        // this.currentScene = nextScene;

        // if (nextScene === SCENE_NAME_LEVEL_SELECT) {
        //     this.previousScene = SCENE_NAME_START;

        //     // To Do - Scenario is FROM GAME PLAY TO SCENE_NAME_LEVEL_SELECT

        // } else if (nextScene === SCENE_NAME_GAME_PLAY) {
        //     this.previousScene = SCENE_NAME_LEVEL_SELECT
        // } else if (nextScene === SCENE_NAME_LEVEL_END) {
        //     this.previousScene = SCENE_NAME_GAME_PLAY;
        // } // To Do - Add the other logic here when switching scenes from end level

        // const scenes = {
        //     currentScene: this.currentScene,
        //     previousScene: this.previousScene
        // }
        // this.notifySubscribers(UPDATED_CURRENT_SCENE_EVENT, scenes);
    }

    private gameStateGamePlayDataListener(updatedGamePlayData) {
        //Updated gamePlayData comes from level-selection and level-end scene.
        this.gamePlayData = updatedGamePlayData;
        this.isGamePaused = false;
    }

    private updateGamePauseActivity(isPaused: boolean) {
        this.isGamePaused = isPaused;
    }

    private updateGameTrailToggle(isTrailEffectOn: boolean) {
        //To do - Move this to DOM-Events once it has been created.
        this.clickTrailToggle = isTrailEffectOn;
    }

    setDefaultGameStateValues(
        data: DataModal,
        canvas: HTMLCanvasElement,
        canavsElement: HTMLCanvasElement
    ) {
        //Original game data from FeedTheMonster.ts.
        this.data = data;
        //HTML and Canvas state values.
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.canavsElement = canavsElement;
        this.context = canavsElement.getContext("2d");
        this.gameCanvasContext = canvas.getContext("2d", { willReadFrequently: true });
        //Game state values - Scene Handler Data - To Do Add Below Here
        //Game state values - Start Scene Data - To Do Add Below Here
        //Game state values - Level Selection Scene Data - To Do Add Below Here
        /* Game state values - Gameplay Scene Data */
        this.feedbackTexts = data.FeedbackTexts;
        this.feedbackAudios = data.FeedbackAudios;
        this.rightToLeft = data.rightToLeft;
        this.majVersion = data.majVersion;
        this.minVersion = data.minVersion;
        //Game state values - Level End Scene Data - To Do Add Below Here
    }

    getGamePlaySceneDetails() {
        return createGameplaySceneDAO(this);
    }
};

const gameStateServiceInstance = new GameStateService();

export default gameStateServiceInstance;