import {
    StoneConfig,
    LOADPUZZLE,
    STONEDROP,
    Debugger,
    lang,
} from "@common";
import {
    SCENE_NAME_LEVEL_SELECT,
    SCENE_NAME_GAME_PLAY_REPLAY,
    SCENE_NAME_PROGRESS_LEVEL,
    SCENE_NAME_LEVEL_END,
    PreviousPlayedLevel,
} from "@constants";
import { GameScore, DataModal } from "@data";
import { AnalyticsIntegration, AnalyticsEventType } from "../../analytics/analytics-integration";
import gameStateService from '@gameStateService';
import miniGameStateService from '@miniGameStateService';
import { MonsterController } from "./monster-controller";
import { GameplayUIManager } from "./gameplay-ui-manager";
import PuzzleHandler from "@gamepuzzles/puzzleHandler/puzzleHandler";
import { StoneHandler, AudioPlayer } from "@components";
import { MiniGameHandler } from '@miniGames/miniGameHandler';
import TutorialHandler from '@tutorials';

export class GameplayFlowManager {

    // #region State Properties
    private currentPuzzleIndex: number = 0;
    private score: number = 0;
    private treasureChestScore: number = 0;
    private startTime: number;
    private puzzleTime: number;
    private isCorrect: boolean = false;
    private hasShownChest: boolean = false;
    private levelForMinigame: number;
    private isDisposing: boolean = false;
    // #endregion

    // #region Dependencies
    private levelData: any;
    private data: DataModal;
    private jsonVersionNumber: string;
    private monsterController: MonsterController;
    private uiManager: GameplayUIManager;
    private puzzleHandler: PuzzleHandler;
    private stoneHandler: StoneHandler;
    private miniGameHandler: MiniGameHandler;
    private tutorial: TutorialHandler;
    private analyticsIntegration: AnalyticsIntegration;
    // #endregion

    constructor(
        levelData: any,
        data: DataModal,
        jsonVersionNumber: string,
        monsterController: MonsterController,
        uiManager: GameplayUIManager,
        puzzleHandler: PuzzleHandler,
        stoneHandler: StoneHandler,
        miniGameHandler: MiniGameHandler,
        tutorial: TutorialHandler
    ) {
        this.levelData = levelData;
        this.data = data;
        this.jsonVersionNumber = jsonVersionNumber;
        this.monsterController = monsterController;
        this.uiManager = uiManager;
        this.puzzleHandler = puzzleHandler;
        this.stoneHandler = stoneHandler;
        this.miniGameHandler = miniGameHandler;
        this.tutorial = tutorial;
        
        this.analyticsIntegration = AnalyticsIntegration.getInstance();
        
        // Initialize Level logic
        this.levelForMinigame = miniGameStateService.shouldShowMiniGame({
            levelSegmentLength: this.levelData.puzzles.length,
            gameLevel: this.levelData.levelNumber
        });
        
        this.startGameTime();
        this.startPuzzleTime();
    }

    // #region Public Flow Control
    /**
     * Determines the next game flow after a puzzle event (solved or timed out).
     * Decides whether to trigger a mini-game or proceed to loading the next puzzle,
     * applying delays when needed to allow audio/animations to finish.
     */
    public determineNextStep(isCorrect: boolean | null = null, isTimeOver: boolean = false): void {
        const currentLevel = this.currentPuzzleIndex + 1;
        
        if (isCorrect !== null) {
            this.isCorrect = isCorrect;
        }

        const loadPuzzleDelay = this.isCorrect ? 1500 : 3000;

        if (currentLevel === this.levelForMinigame && !this.hasShownChest) {
            this.hasShownChest = true;

            // Publish event BEFORE starting the mini game
            miniGameStateService.publish(
                miniGameStateService.EVENTS.MINI_GAME_WILL_START,
                { level: currentLevel }
            );

            // Run chest animation (mini game)
            this.miniGameHandler.draw();
            return;
        } else {
            // For incorrect answers only; Start loading the next puzzle with 2 seconds delay to let the audios play.
            const delay = this.isCorrect || isTimeOver ? 0 : 2000;
            setTimeout(() => {
                this.loadPuzzle(isTimeOver, loadPuzzleDelay);
            }, delay);
        }
    }

    public handleStoneDropResult(isCorrect: boolean, pickedStone: StoneConfig | null): void {
        this.isCorrect = isCorrect;
        if (isCorrect) {
            this.score += 100;
            this.monsterController.playSuccessAnimation();
        } else {
            this.monsterController.playFailureAnimation();
        }

        const puzzleType = this.levelData.levelMeta.levelType;
        this.logPuzzleEndFirebaseEvent(isCorrect, pickedStone, puzzleType);
        
        // Dispatch event for other listeners (effects, etc)
        const dropStoneEvent = new CustomEvent(STONEDROP, {
            detail: { isCorrect: isCorrect },
        });
        document.dispatchEvent(dropStoneEvent);

        this.tutorial?.hideTutorial();
    }

    public handleMiniGameDone(miniGameScore: number): void {
         this.treasureChestScore = miniGameScore;
         // Load the next puzzle segment after mini game regardless if the user scored or not.
         this.loadPuzzle(false, 4500);
    }
    // #endregion

    // #region Private Helpers
    private loadPuzzle(isTimerEnded: boolean, loadPuzzleDelay: number): void {
        const timerEnded = Boolean(isTimerEnded);
        this.tutorial?.resetTutorialTimer();
        
        if (timerEnded) {
            this.logPuzzleEndFirebaseEvent(false, null, "TIMEOUT");
        }

        this.currentPuzzleIndex += 1;
        
        // Reset the 6-second tutorial delay timer each time a new puzzle is loaded
        this.tutorial?.resetQuickStartTutorialDelay();
        this.tutorial?.hideTutorial(); // Turn off tutorial via loading the puzzle.

        /*
          setTimeoutDelay:
          -Adds a delay to properly create and load the next puzzle.
          -Trigger the handleLevelEnd with a delay to let the audio play in puzzleHandler.ts before switching to level end screen.
        */
        const setTimeoutDelay = timerEnded ? 0 : loadPuzzleDelay;
        
        if (this.currentPuzzleIndex === this.levelData.puzzles.length) {
            // Level Completed
            this.handleLevelCompletion(timerEnded, setTimeoutDelay);
        } else {
            // Next Puzzle
            this.scheduleNextPuzzle(setTimeoutDelay);
        }
    }

    private handleLevelCompletion(isTimerEnded: boolean, delay: number): void {
        // Update the stars level indicator.
        this.uiManager.updateStars(this.currentPuzzleIndex, this.isCorrect);

        setTimeout(() => {
            this.logLevelEndFirebaseEvent();
            const starsCount = GameScore.calculateStarCount(this.score);
            const levelEndData = {
                starCount: starsCount,
                currentLevel: this.levelData.levelNumber,
                isTimerEnded: isTimerEnded,
                treasureChestScore: this.treasureChestScore,
                score: this.score,
            };

            gameStateService.publish(
                gameStateService.EVENTS.LEVEL_END_DATA_EVENT,
                { levelEndData, data: this.data }
            );

            // Save to local storage.
            GameScore.setGameLevelScore(
                this.levelData,
                this.score,
                this.treasureChestScore
            );

            this.switchSceneAtGameEnd(starsCount, this.treasureChestScore);
            this.monsterController.dispose();
        }, delay);
    }

    private scheduleNextPuzzle(delay: number): void {
        const loadPuzzleEvent = new CustomEvent(LOADPUZZLE, {
            detail: {
                counter: this.currentPuzzleIndex,
                levelSegmentResult: this.isCorrect
            },
        });

        setTimeout(() => {
            if (!this.isDisposing) {
                this.initNewPuzzle(loadPuzzleEvent);
                this.uiManager.startTimer(); // Start the timer for the new puzzle
            }
        }, delay);
    }

    private initNewPuzzle(loadPuzzleEvent: CustomEvent): void {
        this.monsterController.resetForNextPuzzle();
        this.isCorrect = false;
        
        // Reset Times
        this.startPuzzleTime();
        this.tutorial?.resetQuickStartTutorialDelay();

        // Initialize Puzzle
        this.puzzleHandler.initialize(this.levelData, this.currentPuzzleIndex);
        
        // Dispatch event so StoneHandler (listener) can redraw
        document.dispatchEvent(loadPuzzleEvent); 
    }

    /**
     * Determines which scene to load at the end of a game round.
     *
     * If the monster is not at its final phase and the player achieved a
     * successful result (either through stars or treasure chest score),
     * the Progress Jar scene will be displayed. Otherwise, the flow
     * proceeds directly to the Level End scene.
     *
     * @param starsCount The number of stars earned in the current level.
     * @param treasureChestScore The score earned from the treasure chest mini-game.
     */
    private switchSceneAtGameEnd(starsCount: number, treasureChestScore: number): void {
        const shouldDisplayProgressJar = gameStateService.shouldDisplayProgressJar(
            starsCount,
            treasureChestScore
        );

        const loadSceneName = shouldDisplayProgressJar
            ? SCENE_NAME_PROGRESS_LEVEL
            : SCENE_NAME_LEVEL_END;

        // Signal the game state service to switch scenes.
        gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, loadSceneName);
    }
    // #endregion

    // #region Analytics
    private logPuzzleEndFirebaseEvent(isCorrect: boolean, pickedStone: StoneConfig | null, puzzleType?: string): void {
        const endTime = Date.now();
        const droppedLetters = this.puzzleHandler.getWordPuzzleDroppedLetters();
        const itemSelected = puzzleType === "Word"
          ? (droppedLetters ?? "TIMEOUT")
          : (pickedStone?.text ?? "TIMEOUT");

        this.analyticsIntegration.track(
            AnalyticsEventType.PUZZLE_COMPLETED,
            {
                json_version_number: this.jsonVersionNumber,
                success_or_failure: isCorrect ? "success" : "failure",
                level_number: this.levelData.levelMeta.levelNumber,
                puzzle_number: this.currentPuzzleIndex,
                item_selected: itemSelected,
                target: this.stoneHandler.getCorrectTargetStone(),
                foils: Array.isArray(this.stoneHandler.getFoilStones())
                    ? this.stoneHandler.getFoilStones().join(',')
                    : this.stoneHandler.getFoilStones(),
                response_time: (endTime - this.puzzleTime) / 1000,
            }
        );
    }

    private logLevelEndFirebaseEvent(): void {
        const endTime = Date.now();
        this.analyticsIntegration.track(
            AnalyticsEventType.LEVEL_COMPLETED,
            {
                json_version_number: this.jsonVersionNumber,
                success_or_failure: GameScore.calculateStarCount(this.score) >= 3 ? "success" : "failure",
                number_of_successful_puzzles: this.score / 100,
                level_number: this.levelData.levelMeta.levelNumber,
                duration: (endTime - this.startTime) / 1000,
            }
        );
    }

    private startGameTime(): void {
        this.startTime = Date.now();
    }

    private startPuzzleTime(): void {
        this.puzzleTime = Date.now();
    }
    // #endregion

    public dispose(): void {
        this.isDisposing = true;
    }
    
    public get currentPuzzleIndexValue(): number {
        return this.currentPuzzleIndex;
    }
}