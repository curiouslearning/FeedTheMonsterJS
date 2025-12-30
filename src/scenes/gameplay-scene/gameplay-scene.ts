import {
  TimerTicking,
  PromptText,
  PauseButton,
  LevelIndicators,
  StoneHandler,
  BackgroundHtmlGenerator,
  AudioPlayer,
  PhasesBackground,
  TrailEffectsHandler,
} from "@components";
import TutorialHandler from '@tutorials';
import {
  StoneConfig,
  LOADPUZZLE,
  STONEDROP,
  VISIBILITY_CHANGE,
  Debugger,
  lang,
  pseudoId,
  Utils,
} from "@common";
import { GameScore, DataModal } from "@data";
import {
  LevelCompletedEvent,
  PuzzleCompletedEvent,
} from "../../analytics/analytics-event-interface";
import { AnalyticsIntegration, AnalyticsEventType } from "../../analytics/analytics-integration";
import {
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_GAME_PLAY_REPLAY,
  SCENE_NAME_PROGRESS_LEVEL,
  SCENE_NAME_LEVEL_END,
  PreviousPlayedLevel,
  AUDIO_PATH_POINTS_ADD,
  JAR_FILLING,
  MATCHBOX,
  SHINE,
  SWOOSH,
  SURPRISE_BONUS_STAR,
} from "@constants";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import miniGameStateService from '@miniGameStateService';
import { PAUSE_POPUP_EVENT_DATA, PausePopupComponent } from '@components/popups/pause-popup/pause-popup-component';
import PuzzleHandler from "@gamepuzzles/puzzleHandler/puzzleHandler";
import { DEFAULT_SELECTORS } from '@components/prompt-text/prompt-text';
import { MiniGameHandler } from '@miniGames/miniGameHandler'
import { GameplayInputManager } from './gameplay-input-manager';
import { MonsterController } from './monster-controller';

export class GameplayScene {
  public width: number;
  public height: number;
  public monsterController: MonsterController;
  public jsonVersionNumber: string;
  public canvas: HTMLCanvasElement;
  public levelData: any;
  public timerTicking: TimerTicking;
  public promptText: PromptText;
  public pauseButton: PauseButton;
  public tutorial: TutorialHandler;
  public id: string;
  public context: CanvasRenderingContext2D;
  public levelIndicators: LevelIndicators;
  public stonesCount: number = 1;
  public pickedStone: StoneConfig;
  public puzzleStartTime: number;
  pausePopupComponent: PausePopupComponent
  public feedBackTexts: any;
  public isPuzzleCompleted: boolean;
  public rightToLeft: boolean;
  public levelNumber: Function;
  stoneHandler: StoneHandler;
  public counter: number = 0;
  handler: HTMLElement;
  pickedStoneObject: StoneConfig;
  isPauseButtonClicked: boolean;
  public background: any;
  feedBackTextCanavsElement: HTMLCanvasElement;
  public isGameStarted: boolean = false;
  public time: number = 0;
  public score: number = 0;
  private data: DataModal;
  audioPlayer: AudioPlayer;
  analyticsIntegration: AnalyticsIntegration;
  startTime: number;
  puzzleTime: number;
  isDisposing: boolean = false;
  trailEffectHandler: TrailEffectsHandler;
  public riveMonsterElement: HTMLCanvasElement;
  public gameControl: HTMLCanvasElement;
  private unsubscribeEvent: () => void;
  public unsubscribeMiniGameEvent: () => void;
  public unsubscribeLoadGamePuzzle: () => void;
  private eventListenersAdded: (() => void)[];
  public timeTicker: HTMLElement;
  isFeedBackTriggered: boolean;
  public monsterPhaseNumber: 0 | 1 | 2 | 3;
  private backgroundGenerator: PhasesBackground;
  private puzzleHandler: any;
  private timerStartSFXPlayed: boolean;
  public inputManager: GameplayInputManager;
  private hasShownChest: boolean = false;
  private miniGameHandler: MiniGameHandler;
  public isCorrect: boolean;
  private levelForMinigame: number;
  private treasureChestScore: number;

  constructor() {
    const gamePlayData = gameStateService.getGamePlaySceneDetails();
    this.levelForMinigame = miniGameStateService.shouldShowMiniGame({
      levelSegmentLength: gamePlayData.levelData.puzzles.length,
      gameLevel: gamePlayData.levelData.levelNumber
    });
    this.treasureChestScore = 0;
    this.miniGameHandler = new MiniGameHandler(gamePlayData.levelData.levelNumber);
    this.pausePopupComponent = new PausePopupComponent();
    // Assign state properties based on game state
    this.initializeProperties(gamePlayData);
    // UI element setup
    this.setupUIElements();
    // Initialize additional game elements
    this.initializeGameComponents(gamePlayData);
    var previousPlayedLevel: string = this.levelData.levelMeta.levelNumber;
    Debugger.DebugMode
      ? localStorage.setItem(
        PreviousPlayedLevel + lang + "Debug",
        previousPlayedLevel
      )
      : localStorage.setItem(PreviousPlayedLevel + lang, previousPlayedLevel);
    this.puzzleHandler = new PuzzleHandler(this.levelData, this.counter, gamePlayData.feedbackAudios);
    
    this.monsterController = new MonsterController(this.riveMonsterElement, this.monsterPhaseNumber);

    this.inputManager = new GameplayInputManager(
      this.canvas,
      this.stoneHandler,
      this.puzzleHandler,
      this.monsterController
    );

    this.addEventListeners();
    this.startGameTime();
    this.startPuzzleTime();
    this.analyticsIntegration = AnalyticsIntegration.getInstance();
    this.audioPlayer = new AudioPlayer();
    
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      (isPause: boolean) => {
        this.isPauseButtonClicked = isPause;
        if (isPause) this.pausePopupComponent.open();
      }
    );
    this.unsubscribeLoadGamePuzzle = gameStateService.subscribe(
      gameStateService.EVENTS.LOAD_NEXT_GAME_PUZZLE,
      () => {
        this.determineNextStep(this.isCorrect);
      });
    this.unsubscribeMiniGameEvent = miniGameStateService.subscribe(
      miniGameStateService.EVENTS.IS_MINI_GAME_DONE,
      ({ miniGameScore, gameLevel }: {
        miniGameScore: number,
        gameLevel: number,
      }) => {
        //Assigned new score that will be submited to GameScore at the end of game level.
        this.treasureChestScore = miniGameScore;
        //Load the next puzzle segment after mini game regardless if the user scored or not.
        this.loadPuzzle(false, 4500);
      });
    this.pausePopupComponent.onClose((event) => {
      const { data } = event;

      switch (data) {
        case PAUSE_POPUP_EVENT_DATA.RESTART_LEVEL:
          gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, {
            currentLevelData: this.levelData,
            selectedLevelNumber: this.levelNumber,
          });
          gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_GAME_PLAY_REPLAY);
          break;
        case PAUSE_POPUP_EVENT_DATA.SELECT_LEVEL:
          gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
          gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_SELECT)
        default:
          gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
          this.resumeGame();
      }
    });
    //this.setupBg(); //Temporary disabled to try evolution background.
    this.setupMonsterPhaseBg();
    this.timerStartSFXPlayed = false;
    this.audioPlayer.preloadGameAudio(AUDIO_PATH_POINTS_ADD); // to preload the PointsAdd.wav
    this.audioPlayer.preloadGameAudio(MATCHBOX);
    this.audioPlayer.preloadGameAudio(SHINE);
    this.audioPlayer.preloadGameAudio(SWOOSH);
    this.audioPlayer.preloadGameAudio(JAR_FILLING);
    this.audioPlayer.preloadGameAudio(SURPRISE_BONUS_STAR);
  }

  private initializeGameComponents(gamePlayData) {
    this.trailEffectHandler = new TrailEffectsHandler(this.canvas)
    this.pauseButton = new PauseButton();
    this.pauseButton.onClick(() => {
      gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
      this.pauseGamePlay();
    });
    this.timerTicking = new TimerTicking(
      this.width,
      this.height,
      (isMyTimerOver: boolean) => {
        //Callback triggered when timer ends.
        this.determineNextStep(false, isMyTimerOver);
      }
    );
    this.stoneHandler = new StoneHandler(
      this.context,
      this.canvas,
      this.counter,
      this.levelData
    );
    this.tutorial = new TutorialHandler({
      context: this.context,
      width: this.width,
      height: this.height,
      puzzleLevel: this.counter,
      shouldHaveTutorial: gamePlayData?.tutorialOn
    });

    let onClickCallback;
    /**
     * Assign the onClickCallback ONLY for audio puzzle levels where the tutorial hand pointer should be shown.
     * This callback is passed to the PromptText component and is triggered when the prompt is clicked.
     * When invoked, it starts the tutorial hand animation and marks the quick start tutorial as ready.
     * For non-audio puzzles or levels without the hand pointer tutorial, no callback is assigned.
     */
    //TO DO - This needs to be cleaned up. Utilize the game event feature rather than using nested call back approach.
    if (this.tutorial.showHandPointerInAudioPuzzle(gamePlayData.levelData)) {
      onClickCallback = () => {
        this.tutorial.shouldShowQuickStartTutorial = true;
        this.tutorial.quickStartTutorialReady = true;
      };
    }

    this.promptText = new PromptText(
      this.width,
      this.levelData.puzzles[this.counter],
      this.levelData,
      this.rightToLeft,
      'prompt-container',  // id parameter (string)
      { selectors: DEFAULT_SELECTORS },  // options parameter
      !gamePlayData?.isTutorialCleared && gamePlayData?.tutorialOn && this.counter === 0,// Has tutorial + uncleared tutorial and at segment 0.
      onClickCallback,
    );
    this.levelIndicators = new LevelIndicators();

    /*TO DO: The following code lines of this method should've been and can be handled within the tutorial class.
      we could have a method in the tutorial that accepts gamePlayData - tutorialOn, isTutorialCleared and levelData.
    */
    //For shouldShowQuickStartTutorial- If the game level should have tutorial AND level is not yet cleared, timer should be delayed.
    this.tutorial.shouldShowQuickStartTutorial = gamePlayData.tutorialOn && !gamePlayData.isTutorialCleared;

    if (this.tutorial.showHandPointerInAudioPuzzle(gamePlayData.levelData)) {
      this.tutorial?.resetQuickStartTutorialDelay();
    } else {
      this.tutorial.quickStartTutorialReady = true;
    }
  }

  private setupUIElements() {
    const { canvasElem, canvasWidth, canvasHeight, gameCanvasContext, gameControlElem } = gameSettingsService.getCanvasSizeValues();
    const riveMonsterElement = gameSettingsService.getRiveCanvasValue();
    this.handler = canvasElem;
    this.riveMonsterElement = riveMonsterElement;
    this.riveMonsterElement.style.zIndex = "4";
    this.gameControl = gameControlElem;
    this.gameControl.style.zIndex = "5";
    this.canvas = canvasElem;
    this.width = Utils.getResponsiveCanvasWidth();
    this.height = canvasHeight;
    this.context = gameCanvasContext;
  }

  private initializeProperties(gamePlayData) {
    this.isPauseButtonClicked = gamePlayData?.isGamePaused;
    this.rightToLeft = gamePlayData.rightToLeft;
    this.levelData = gamePlayData.levelData;
    this.levelNumber = gamePlayData.levelNumber;
    this.jsonVersionNumber = gamePlayData.jsonVersionNumber;
    this.feedBackTexts = gamePlayData.feedBackTexts;
    this.data = gamePlayData.data;
    this.monsterPhaseNumber = gamePlayData.monsterPhaseNumber;
  }

  setupBg = () => {
    // Determine the background type based on the level number using the static method
    const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(this.levelData.levelMeta.levelNumber);

    // Apply the logic to update the HTML or visual representation of the background
    const backgroundGenerator = new BackgroundHtmlGenerator();

    // Dynamically update the background based on the selected type
    backgroundGenerator.generateBackground(selectedBackgroundType);
  };

  setupMonsterPhaseBg() {
    // Determine the background type based on the monster phase number using the static method
    this.backgroundGenerator = new PhasesBackground();

    // Dynamically update the background based on the selected type
    this.backgroundGenerator.generateBackground(this.monsterController.currentPhase as any);
  }

  resumeGame = () => {
    this.addEventListeners();
    // Resume the clock rotation when game is resumed
    this.timerTicking?.applyRotation(this.timerTicking?.startMyTimer && !this.timerTicking?.isStoneDropped);
  };

  private setGameToStart() {
    this.isGameStarted = true;
    this.time = 0;
    this.trailEffectHandler.setGameHasStarted(true);
  }

  draw(deltaTime: number) {
    const timeRef = { value: this.time };
    //this.promptText.handleAutoPromptPlay(deltaTime);
    this.tutorial?.handleTutorialAndGameStart({
      deltaTime,
      isGameStarted: this.isGameStarted,
      isPauseButtonClicked: this.isPauseButtonClicked,
      setGameToStart: this.setGameToStart.bind(this),
      timeRef
    });
    this.time = timeRef.value;

    // Trail effects drawing 
    this.trailEffectHandler?.draw();
    // Main game logic only starts after isGameStarted = true
    if (this.isGameStarted) {
      this.handleStoneLetterDrawing();
      this.handleTimerUpdate(deltaTime);
    }

    this.tutorial.draw(deltaTime, this.isGameStarted);
  }

  private handleStoneLetterDrawing() {
    if (this.puzzleHandler.checkIsWordPuzzle()) {
      this.stoneHandler.drawWordPuzzleLetters(
        (foilStoneIndex) => {
          return this.puzzleHandler.validateShouldHideLetter(foilStoneIndex);
        },
        this.puzzleHandler.getWordPuzzleGroupedObj()
      );
    } else {
      this.stoneHandler.draw();
    }
  }

  private handleTimerUpdate(deltaTime: number) {
    // Update timer only once animation is complete and game is not paused.
    if (this.stoneHandler.stonesHasLoaded && !this.isPauseButtonClicked) {
      const hasTutorial = this.tutorial.shouldShowQuickStartTutorial;
      const shouldStartTimer = this.tutorial.updateTutorialTimer(deltaTime);
      if (!hasTutorial || (shouldStartTimer && hasTutorial)) {
        // After 12s, start timer updates
        this.timerTicking.update(deltaTime);
        // added delta time checking to ensure that the timer starts sfx will only trigger once at the beginning of the timer countdown.
        if (!this.timerStartSFXPlayed && deltaTime > 1 && deltaTime <= 100) {
          this.audioPlayer.playAudio(AUDIO_PATH_POINTS_ADD);
          this.timerStartSFXPlayed = true; // This flag needed to ensure that the timer starts sfx will only trigger once.
        }
      }
    }
  }

  handleInputDragStart = () => {
    this.tutorial.shouldShowQuickStartTutorial = false;
  }

  handleInputMonsterClick = () => {
    this.setGameToStart();
    this.tutorial?.activeTutorial?.removeHandPointer();
    gameStateService.publish(
      gameStateService.EVENTS.GAME_HAS_STARTED,
      true
    );
  }

  handleInputStoneDropOnTarget = (detail: any) => {
    const { stone, stoneObject } = detail;
    // Sync local state for potential uses in other methods (like analytics)
    this.pickedStone = stone;
    this.pickedStoneObject = stoneObject;

    const lettersCountRef = { value: this.stonesCount };
    const ctx = {
      levelType: this.levelData.levelMeta.levelType,
      pickedLetter: {
        text: stone.text,
        frame: stone.frame
      },
      targetLetterText: this.stoneHandler.getCorrectTargetStone(),
      handleLetterDropEnd: (isCorrect, puzzleType) => {
        this.isFeedBackTriggered = isCorrect;
        if (isCorrect) {
          this.score += 100;
        }
        this.handleStoneDropEnd(isCorrect, puzzleType);
      },
      triggerMonsterAnimation: (animationName) => this.monsterController.triggerMonsterAnimation(animationName),
      timerTicking: this.timerTicking,
      lang,
      lettersCountRef,
      feedBackTexts: this.feedBackTexts,
    };

    this.puzzleHandler.createPuzzle(ctx);

    if (ctx.levelType === "Word" || ctx.levelType === "SoundWord") {
      this.stoneHandler.hideStone(stoneObject);
    }
    this.stonesCount = lettersCountRef.value;
    this.trailEffectHandler.setGameHasStarted(false);
  }

  handleInputStoneDropMissed = (detail: any) => {
    const { stone, stoneObject } = detail;
    this.stoneHandler.resetStonePosition(
      this.width,
      stone,
      stoneObject
    );
    this.monsterController.triggerMonsterAnimation('isMouthClosed');
    this.monsterController.triggerMonsterAnimation('backToIdle');
  }

  handleInputRequestAnimation = (detail: any) => {
    this.monsterController.triggerMonsterAnimation(detail.animationName);
  }

  private addEventListeners() {
    this.inputManager.addEventListeners(this.handler);
    this.eventListenersAdded = [];

    this.addEventListener(GameplayInputManager.INPUT_DRAG_START, this.handleInputDragStart);
    this.addEventListener(GameplayInputManager.INPUT_MONSTER_CLICK, this.handleInputMonsterClick);
    this.addEventListener(GameplayInputManager.INPUT_STONE_DROP_ON_TARGET, this.handleInputStoneDropOnTarget);
    this.addEventListener(GameplayInputManager.INPUT_STONE_DROP_MISSED, this.handleInputStoneDropMissed);
    this.addEventListener(GameplayInputManager.INPUT_REQUEST_ANIMATION, this.handleInputRequestAnimation);
    document.addEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
  }

  private addEventListener(eventName: string, callback: any): void {
    this.eventListenersAdded.push(gameStateService.subscribe(eventName, callback));
  }

  removeEventListeners() {
    this.inputManager?.removeEventListeners(this.handler);

    if (this.eventListenersAdded) {
      this.eventListenersAdded.forEach(unsubscribe => unsubscribe());
      this.eventListenersAdded = [];
    }

    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
  }

  /**
 * Determines the next game flow after a puzzle event (solved or timed out).
 * Decides whether to trigger a mini-game or proceed to loading the next puzzle,
 * applying delays when needed to allow audio/animations to finish.
 */
  determineNextStep(isCorrect = false, isTimeOver = false) {
    const currentLevel = this.counter + 1;
    const loadPuzzleDelay = isCorrect ? 1500 : 3000;

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
      //For incorrect answers only; Start loading the next puzzle with 2 seconds delay to let the audios play.
      const delay = isCorrect || isTimeOver ? 0 : 2000;
      setTimeout(() => {
        this.loadPuzzle(isTimeOver, loadPuzzleDelay);
      }, delay);
    }
  }

  loadPuzzle = (isTimerEnded: boolean, loadPuzzleDelay: number) => {
    this.removeEventListeners();

    this.stonesCount = 1;
    const timerEnded = Boolean(isTimerEnded);
    this.tutorial?.resetTutorialTimer();
    if (timerEnded) {
      this.logPuzzleEndFirebaseEvent(false);
    }
    this.counter += 1; //increment Puzzle
    this.isGameStarted = false;
    // Reset the 6-second tutorial delay timer each time a new puzzle is loaded
    this.tutorial?.resetQuickStartTutorialDelay();
    this.tutorial?.hideTutorial(); // Turn off tutorial via loading the puzzle.

    /*
      setTimeoutDelay:
      -Adds a delay to properly create and load the next puzzle.
      -Trigger the handleLevelEnd with a delay to let the audio play in puzzleHandler.ts before switching to level end screen. //Trigger the handleLevelEnd with a delay to let the audio play in puzzleHandler.ts before switching to level end screen.
    */
    const setTimeoutDelay = timerEnded ? 0 : loadPuzzleDelay;
    let setTimeoutCallback = null;

    if (this.counter === this.levelData.puzzles.length) {
      //Update the stars level indicator.
      this.levelIndicators?.setIndicators(this.counter, this.isCorrect);

      //Handle level end loading.
      setTimeoutCallback = () => {
        this.logLevelEndFirebaseEvent();
        const starsCount = GameScore.calculateStarCount(this.score);
        const levelEndData = {
          starCount: starsCount,
          currentLevel: this.levelNumber,
          isTimerEnded: timerEnded,
          treasureChestScore: this.treasureChestScore,
          score: this.score,
        }
        gameStateService.publish(
          gameStateService.EVENTS.LEVEL_END_DATA_EVENT,
          { levelEndData, data: this.data }
        );
        //Save to local storage.
        GameScore.setGameLevelScore(
          this.levelData,
          this.score,
          this.treasureChestScore
        );
        this.switchSceneAtGameEnd(starsCount, this.treasureChestScore);
        this.monsterController.dispose();
      };

    } else {
      const loadPuzzleEvent = new CustomEvent(LOADPUZZLE, {
        detail: {
          counter: this.counter,
          levelSegmentResult: this.isCorrect
        },
      });

      setTimeoutCallback = () => {
        if (!this.isDisposing) {
          this.initNewPuzzle(loadPuzzleEvent);
          this.timerTicking.startTimer(); // Start the timer for the new puzzle
        }
      }
    }

    setTimeout(setTimeoutCallback, setTimeoutDelay);
  };

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

  private initNewPuzzle(loadPuzzleEvent) {
    this.monsterController.resetForNextPuzzle();
    this.isCorrect = false;
    this.timerStartSFXPlayed = false; // move this flag from loadpuzzle to initnewpuzzle to make sure when loading new puzzle, timer start sfx will set to false.
    this.stoneHandler.stonesHasLoaded = false;
    this.removeEventListeners();
    this.isGameStarted = false;
    this.time = 0;
    // Ensure puzzleHandler is set up for new puzzle
    this.puzzleHandler.initialize(this.levelData, this.counter);
    this.pickedStone = null;
    document.dispatchEvent(loadPuzzleEvent);
    this.addEventListeners();
    this.audioPlayer.stopAllAudios();
    this.startPuzzleTime();
    this.tutorial?.resetQuickStartTutorialDelay();
  }

  public dispose = () => {
    this.isDisposing = true;
    this.treasureChestScore = 0;
    // Cleanup audio
    if (this.audioPlayer) {
      this.audioPlayer.stopAllAudios();
      this.audioPlayer = null;
    }

    // Dispose visual elements
    if (this.monsterController) {
      this.monsterController.dispose();
      this.monsterController = null;
    }

    if (this.stoneHandler) {
      this.stoneHandler.dispose();
      this.stoneHandler = null;
    }

    // Clear timers
    if (this.timerTicking) {
      this.timerTicking.destroy();
      this.timerTicking = null;
    }

    if (this.trailEffectHandler) {
      this.trailEffectHandler.dispose();
    }

    if (this.tutorial) {
      this.tutorial.dispose();
      this.tutorial = null;
    }

    // Clear event listeners

    if (this.unsubscribeEvent) {
      this.unsubscribeEvent();
      this.unsubscribeMiniGameEvent();
      this.unsubscribeLoadGamePuzzle();
      this.unsubscribeEvent = null;
    }

    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    this.removeEventListeners();

    // Clear other components
    if (this.levelIndicators) {
      this.levelIndicators.dispose();
      this.levelIndicators = null;
    }

    if (this.promptText) {
      this.promptText.dispose();
      this.promptText = null;
    }

    if (this.pauseButton) {
      this.pauseButton.dispose();
      this.pauseButton = null;
    }

    if (this.pausePopupComponent) {
      this.pausePopupComponent.destroy();
      this.pausePopupComponent = null;
    }

    // Clear game state
    this.pickedStone = null;
    this.pickedStoneObject = null;
  }

  private handleStoneDropEnd(isCorrect, puzzleType: string | null = null) {
    if (isCorrect) {
      this.monsterController.playSuccessAnimation();
    } else {
      this.monsterController.playFailureAnimation();
    }

    this.logPuzzleEndFirebaseEvent(isCorrect, puzzleType);
    this.dispatchStoneDropEvent(isCorrect);
    this.tutorial?.hideTutorial(); //  Turn off tutorial via user playing correctly
    this.isCorrect = isCorrect;
  }

  private dispatchStoneDropEvent(isCorrect: boolean): void {
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: { isCorrect: isCorrect },
    });

    document.dispatchEvent(dropStoneEvent);
  }

  public logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string) {
    const endTime = Date.now();
    const droppedLetters = this.puzzleHandler.getWordPuzzleDroppedLetters();

    this.analyticsIntegration.track(
      AnalyticsEventType.PUZZLE_COMPLETED,
      {
        json_version_number: this.jsonVersionNumber,
        success_or_failure: isCorrect ? "success" : "failure",
        level_number: this.levelData.levelMeta.levelNumber,
        puzzle_number: this.counter,
        item_selected: puzzleType === "Word"
          ? (droppedLetters ?? "TIMEOUT")
          : (this.pickedStone?.text ?? "TIMEOUT"),
        target: this.stoneHandler.getCorrectTargetStone(),
        foils: Array.isArray(this.stoneHandler.getFoilStones())
          ? this.stoneHandler.getFoilStones().join(',')
          : this.stoneHandler.getFoilStones(),
        response_time: (endTime - this.puzzleTime) / 1000,
      }
    );
  }

  public logLevelEndFirebaseEvent() {
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

  public startGameTime() {
    this.startTime = Date.now();
  }
  public startPuzzleTime() {
    this.puzzleTime = Date.now();
  }

  public pauseGamePlay = () => {
    this.removeEventListeners();
    this.audioPlayer.stopAllAudios();
    // Stop the clock rotation when game is paused
    this.timerTicking?.applyRotation(false);
  };

  handleVisibilityChange = () => {
    this.audioPlayer.stopAllAudios();
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
    this.pauseGamePlay();
  };

  /**
   * Handles the game pause event.
   */
  handleGamePause = () => {
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
    this.pauseGamePlay();
  };
}
