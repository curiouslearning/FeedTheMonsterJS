import { PubSub } from '../events/pub-sub-events';
import { DataModal, GameScore } from "@data";
import { getGameTypeName } from '@common';

export interface hitboxRangeType {
    hitboxRangeX: {
        from: number,
        to: number
    },
    hitboxRangeY: {
        from: number,
        to: number
    }
}

/*
 * GameStateService.ts
 * The GameStateService class is reponsible to managing the current state of the game (ts).
 * The class also integrates with the Publish-Subscribe pattern
 * to faciliate event-drivent updates, in the game state.
*/

export class GameStateService extends PubSub {
    public EVENTS: {
        START_GAME: string;
        SWITCH_SCENE_EVENT: string;
        GAMEPLAY_DATA_EVENT: string;
        GAME_PAUSE_STATUS_EVENT: string;
        LEVEL_END_DATA_EVENT: string;
        CORRECT_STONE_POSITION: string;
    }
    public data: null | DataModal;
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
    public feedbackTexts: null | {
        amazing: string,
        fantastic: string,
        great: string
    };
    public rightToLeft: boolean;
    public majVersion: number;
    public minVersion: number;
    public monsterPhaseNumber: number;
    public gameTypesFirstInstanceList: {} | {
        LetterInWord: {
            levelNumber: number,
            isCleared: boolean
        };
        LetterOnly: {
            levelNumber: number,
            isCleared: boolean
        };
        SoundLetterOnly: {
            levelNumber: number,
            isCleared: boolean
        };
        Word: {
            levelNumber: number,
            isCleared: boolean
        };
    };
    public feedbackAudios: null | {
        amazing: string,
        fantastic: string,
        great: string
    };
    public levelEndData: null | {
        starCount: number,
        currentLevel: number,
        isTimerEnded: boolean
    };
    public isLastLevel: boolean;
    public currentMonsterPhase: number;
    public tutorialOn: boolean = false;
    public hitboxRanges: null | hitboxRangeType;

    constructor() {
        super();
        this.EVENTS = {
            START_GAME: 'START_GAME',
            SWITCH_SCENE_EVENT: 'SWITCH_SCENE_EVENT',
            GAMEPLAY_DATA_EVENT: 'GAMEPLAY_DATA_EVENT',
            GAME_PAUSE_STATUS_EVENT: 'GAME_PAUSE_STATUS_EVENT',
            LEVEL_END_DATA_EVENT: 'LEVEL_END_DATA_EVENT', // To move this event on DOM Event once created.
            CORRECT_STONE_POSITION: 'CORRECT_STONE_POSITION'  //Stone image, position and level data for tutorial.
        };
        this.data = null;
        /* Gameplay States */
        this.isGamePaused = false;
        this.gamePlayData = null;
        this.feedbackAudios = null;
        this.feedbackTexts = null;
        this.rightToLeft = false;
        this.majVersion = 0;
        this.minVersion = 0;
        this.initListeners();
        this.levelEndData = null;
        this.isLastLevel = false;
        this.tutorialOn = false;
    }

    private initListeners() {
        /* Listeners to update game state values. */
        this.subscribe(this.EVENTS.GAMEPLAY_DATA_EVENT, (data) => { this.gameStateGamePlayDataListener(data); });
        this.subscribe(this.EVENTS.GAME_PAUSE_STATUS_EVENT, (data) => { this.updateGamePauseActivity(data); });
        this.subscribe(this.EVENTS.LEVEL_END_DATA_EVENT, (data) => { this.levelEndSceneData(data); });
    }

    private gameStateGamePlayDataListener(updatedGamePlayData) {
        //Updated gamePlayData comes from level-selection and level-end scene.
        this.gamePlayData = updatedGamePlayData;
        this.isGamePaused = false;
    }

    private updateGamePauseActivity(isPaused: boolean) {
        this.isGamePaused = isPaused;
    }

    getFTMData() {
        return this.data;
    }

    setDefaultGameStateValues(data: DataModal) {
        /*Original game data from FeedTheMonster.ts.*/
        this.data = data;
        this.feedbackTexts = data.FeedbackTexts;
        this.feedbackAudios = data.FeedbackAudios;
        this.rightToLeft = data.rightToLeft;
        this.majVersion = data.majVersion;
        this.minVersion = data.minVersion;
        this.monsterPhaseNumber = this.checkMonsterPhaseUpdation();
        this.gameTypesFirstInstanceList = this.getFirstInstanceOfEachGameTypes(data);
    }

    private getFirstInstanceOfEachGameTypes(data: DataModal) {
        if (data.levels) {
            //Determine the first time game types will appear.
            const levelList: any = data.levels;
            const gameTypes = {};
            let objectKeyName = null;
            //Iterate and find the first instance of each game type puzzles.
            levelList.forEach((levelData, index) => {
                const { levelType, levelNumber, protoType } = levelData?.levelMeta;
                //If prototype is Visible it means its not an audio puzzle.
                objectKeyName = getGameTypeName(protoType, levelType);

                if (!gameTypes.hasOwnProperty(objectKeyName)) {
                    gameTypes[objectKeyName] = {
                        levelNumber, //Game level number on when it will first appear.
                        isCleared: this.checkClearedLevels(levelNumber) //Flag if that tutorial has been cleared.
                    };
                };
            });

            //Return determined game types and what level it will first appear.
            return gameTypes;
        }
        return {}
    }

    private checkClearedLevels(levelNumber: number) {
        const clearedLevels = GameScore.getAllGameLevelInfo();
        let hasCleardLevel = false;
        /*We don't need the whole object in Cleard level data, we just need to check if the
         levelNumber is in the list as it means it that level has been cleared.
        */
        clearedLevels.every((cleardLevels: {
            levelName: string,
            levelNumber: number,
            score: number,
            starCount: number
        }) => {
            if (cleardLevels.levelNumber === levelNumber) {
                hasCleardLevel = true;
                return false; //Return false to break every loop.
            }
            // Return true or else, `every()` will stop.
            return true;
        });

        return hasCleardLevel;
    }

    /*
     * Flag that the current tutorial has been cleared.
    */
    public setClearedTutorial(gameTypeName: string) {
        if (this.gameTypesFirstInstanceList[gameTypeName]) {
            this.gameTypesFirstInstanceList[gameTypeName].isCleared = true;
        }
    }

    public getGameTypeList() {
        return this.gameTypesFirstInstanceList;
    }

    getGamePlaySceneDetails() {
        const versionNumber = !!this.majVersion && !!this.minVersion
            ? this.majVersion.toString() + "." + this.minVersion.toString()
            : "";

        let shouldHaveTutorial = false;
        let isTutorialCleared: boolean = false;
        const selectedLevelNumber: string | number = this.gamePlayData.selectedLevelNumber;
        const levelNumber = typeof selectedLevelNumber === 'string' ? parseInt(selectedLevelNumber) : selectedLevelNumber;
        //Very small array to iterate.
        Object.values(this.gameTypesFirstInstanceList).forEach((listedLevelNumber: { levelNumber: number, isCleared: boolean }) => {
            if (listedLevelNumber?.levelNumber === levelNumber) {
                isTutorialCleared = listedLevelNumber?.isCleared;
                shouldHaveTutorial = true;
                return false; //Return false to break every loop.
            }
        });

        return {
            levelData: { ...this.gamePlayData.currentLevelData },
            levelNumber,
            feedBackTexts: { ...this.feedbackTexts },
            rightToLeft: this?.rightToLeft,
            jsonVersionNumber: versionNumber,
            feedbackAudios: { ...this.feedbackAudios },
            isGamePaused: this.isGamePaused,
            data: this.data,
            isLastLevel: this.isLastLevel,
            monsterPhaseNumber: this.monsterPhaseNumber,
            tutorialOn: shouldHaveTutorial,
            isTutorialCleared
        };
    }

    levelEndSceneData({ levelEndData, data }) {
        this.levelEndData = { ...levelEndData };
        this.data = data;
        this.isLastLevel = levelEndData.currentLevel === data.levels[data.levels.length - 1].levelMeta.levelNumber;
    }

    getLevelEndSceneData() {
        return {
            starCount: this.levelEndData.starCount,
            currentLevel: this.levelEndData.currentLevel,
            isTimerEnded: this.levelEndData.isTimerEnded,
            data: this.data,
            monsterPhaseNumber: this.monsterPhaseNumber
        };
    }

    public getTotalStars() {
        return GameScore.getTotalStarCount();
    }

    public checkMonsterPhaseUpdation(): number {
        const totalStarCount = this.getTotalStars();
        switch (true) {
            case totalStarCount >= 38:
                return 3; // Phase 4
            case totalStarCount >= 23:
                return 2; // Phase 3
            case totalStarCount >= 8:
                return 1; // Phase 2
            default:
                return 0; // Phase 1 (default)
        }
    }

    public updateMonsterPhaseState(newMonsterPhaseNum: number) {
        this.monsterPhaseNumber = newMonsterPhaseNum;
    }

    public saveHitBoxRanges(hitboxRangeXandY: hitboxRangeType) {
        this.hitboxRanges = hitboxRangeXandY;
    }

    public getHitBoxRanges() {
        return this.hitboxRanges;
    }
};
