import { PubSub } from '../events/pub-sub-events';
import { DataModal } from "@data";
import {
    createLoadingSceneDAO,
    createGameplaySceneDAO,
    createStonePositionsDAO
} from './data-access-objects';

/*
 * GameStateService.ts
 *
 * The GameStateService class is reponsible to managing the current state of the game (ts).
 * It also provides methods for accessing these properties using a set of getters
 * that returns data access objects (DAO), used during initialization.
 * The class also integrates with the Publish-Subscribe pattern
 * to faciliate event-drivent updates, in the game state.
*/

export class GameStateService extends PubSub {
    public EVENTS: {
        SCENE_LOADING_EVENT: string;
        GAMEPLAY_DATA_EVENT: string;
        GAME_PAUSE_STATUS_EVENT: string;
        GAME_TRAIL_EFFECT_TOGGLE_EVENT: string;
    }
    public data: null | DataModal;
    public canvas: null | HTMLCanvasElement;
    public width: number;
    public height: number;
    public canavsElement: null | HTMLCanvasElement;
    public context: null | CanvasRenderingContext2D;
    public gameCanvasContext: null | CanvasRenderingContext2D;
    public riveCanvas: null | CanvasRenderingContext2D;
    public riveCanvasWidth: number;
    public riveCanvasHeight: number;
    public loadingCanvas: null | HTMLCanvasElement;
    public loadingContext: null | CanvasRenderingContext2D;
    public isGamePaused: boolean;
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
    public majVersion: number;
    public minVersion: number;
    public feedbackAudios: null | {
        amazing: string,
        fantastic: string,
        great: string
    };
    public clickTrailToggle: boolean;
    public offsetCoordinateValue: number;

    constructor() {
        super();
        this.EVENTS = {
            SCENE_LOADING_EVENT: 'SCENE_LOADING_EVENT',
            GAMEPLAY_DATA_EVENT: 'GAMEPLAY_DATA_EVENT',
            GAME_PAUSE_STATUS_EVENT: 'GAME_PAUSE_STATUS_EVENT',
            GAME_TRAIL_EFFECT_TOGGLE_EVENT: 'GAME_TRAIL_EFFECT_TOGGLE_EVENT', // To move this event on DOM Event once created.
        };
        this.data = null;
        /*
            Canvas State Variables - These need to be moved from the game state
            to the game settings for better organization.
            To Do: Transfer Canvas States variables to game settings
            To Do: Transfer some Gameplay States - feedbackAudios, feedbackTexts, majVersion, minVersion, and offsetCoordinateValue to game settings.
            To Do: Transfer clickTrailToggle and updateGameTrailToggle to DOM Events class.
            To DO: Transfer createLoadingSceneDAO to game settings.
        */
        /* Start of Canvas States */
        this.canvas = null;
        this.width = 0;
        this.height = 0;
        this.canavsElement = null;
        this.context = null;
        this.gameCanvasContext = null;
        this.riveCanvas = null;
        this.riveCanvasWidth = 0;
        this.riveCanvasHeight = 0;
        /* Gameplay States */
        this.isGamePaused = false;
        this.gamePlayData = null;
        this.feedbackAudios = null;
        this.feedbackTexts = null;
        this.rightToLeft = false;
        this.majVersion = 0;
        this.minVersion = 0;
        this.clickTrailToggle = false;
        this.offsetCoordinateValue = 32; //Default value used to offset stone coordinates.
        this.initListeners();
    }

    private initListeners() {
        /* Listeners to update game state values. */
        this.subscribe(this.EVENTS.GAMEPLAY_DATA_EVENT, (data) => { this.gameStateGamePlayDataListener(data); });
        this.subscribe(this.EVENTS.GAME_PAUSE_STATUS_EVENT, (data) => { this.updateGamePauseActivity(data); });
        this.subscribe(this.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT, (data) => { this.updateGameTrailToggle(data); }); // To move this event on DOM Event once created.
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
        /*Original game data from FeedTheMonster.ts.*/
        this.data = data;
        /*HTML and Canvas state values.*/
        this.canvas = canvas; 
        this.width = canvas.width;
        this.height = canvas.height;
        this.canavsElement = canavsElement;
        this.context = canavsElement.getContext("2d");
        this.gameCanvasContext = canvas.getContext("2d", { willReadFrequently: true });
        this.loadingCanvas = document.getElementById("loading") as HTMLCanvasElement;
        this.loadingContext = this.loadingCanvas.getContext("2d");
        /*Gameplay Scene Data */
        this.feedbackTexts = data.FeedbackTexts;
        this.feedbackAudios = data.FeedbackAudios;
        this.rightToLeft = data.rightToLeft;
        this.majVersion = data.majVersion;
        this.minVersion = data.minVersion;
    }

    getLoadingSceneDetails() { //To Do: Move this method to game settings.
        //Returns canvas measurements.
        return createLoadingSceneDAO(this);
    }

    getGamePlaySceneDetails() {
        return createGameplaySceneDAO(this);
    }

    getStonePositions() {
        return createStonePositionsDAO(this);
    }
};

const gameStateServiceInstance = new GameStateService();

export default gameStateServiceInstance;