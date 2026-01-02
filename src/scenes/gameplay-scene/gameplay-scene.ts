import {
  StoneHandler,
  BackgroundHtmlGenerator,
  AudioPlayer,
  PhasesBackground,
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
import { DataModal } from "@data";
import { AnalyticsIntegration } from "../../analytics/analytics-integration";
import {
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY_REPLAY,
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
import PuzzleHandler from "@gamepuzzles/puzzleHandler/puzzleHandler";
import { MiniGameHandler } from '@miniGames/miniGameHandler'
import { GameplayInputManager } from './gameplay-input-manager';
import { MonsterController } from './monster-controller';
import { GameplayUIManager } from "./gameplay-ui-manager";
import { GameplayFlowManager } from "./gameplay-flow-manager";

export class GameplayScene {
  // #region Properties
  // Core Dependencies
  public monsterController: MonsterController;
  public uiManager: GameplayUIManager;
  public flowManager: GameplayFlowManager;
  public inputManager: GameplayInputManager;
  public audioPlayer: AudioPlayer;
  public analyticsIntegration: AnalyticsIntegration;
  public stoneHandler: StoneHandler;
  public tutorial: TutorialHandler;
  
  // State
  public isGameStarted: boolean = false;
  public isPauseButtonClicked: boolean;
  public stonesCount: number = 1;
  public time: number = 0;
  public monsterPhaseNumber: 0 | 1 | 2 | 3;
  
  // Data
  public levelData: any;
  public levelNumber: Function;
  public jsonVersionNumber: string;
  public feedBackTexts: any;
  public rightToLeft: boolean;
  private data: DataModal;
  
  // Canvas & Elements
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public width: number;
  public height: number;
  public riveMonsterElement: HTMLCanvasElement;
  public gameControl: HTMLCanvasElement;
  public handler: HTMLElement;
  public id: string;
  public background: any;

  // Internal Logic
  public pickedStone: StoneConfig;
  public pickedStoneObject: StoneConfig;
  private puzzleHandler: PuzzleHandler;
  private miniGameHandler: MiniGameHandler;
  private backgroundGenerator: PhasesBackground;
  private timerStartSFXPlayed: boolean;
  public isDisposing: boolean = false;
  
  // Event Management
  private unsubscribeEvent: () => void;
  public unsubscribeMiniGameEvent: () => void;
  public unsubscribeLoadGamePuzzle: () => void;
  private eventListenersAdded: (() => void)[];
  private boundHandleVisibilityChange: () => void;
  private boundHandleUiPopupRestart: () => void;
  
  // Legacy/Unused
  isFeedBackTriggered: boolean;
  // #endregion

  // #region Constructor
  constructor() {
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.boundHandleUiPopupRestart = this.handleUiPopupRestart.bind(this);

    const gamePlayData = gameStateService.getGamePlaySceneDetails();
    this.miniGameHandler = new MiniGameHandler(gamePlayData.levelData.levelNumber);
    
    // Assign state properties based on game state
    this.initializeProperties(gamePlayData);
    
    // UI element setup
    this.setupUIElements();
    
    this.uiManager = new GameplayUIManager(
      this.context,
      this.canvas,
      this.width,
      this.height,
      gamePlayData
    );
    
    // Initialize additional game elements
    this.initializeGameComponents(gamePlayData);
    
    var previousPlayedLevel: string = this.levelData.levelMeta.levelNumber;
    Debugger.DebugMode
      ? localStorage.setItem(
        PreviousPlayedLevel + lang + "Debug",
        previousPlayedLevel
      )
      : localStorage.setItem(PreviousPlayedLevel + lang, previousPlayedLevel);
      
    this.puzzleHandler = new PuzzleHandler(this.levelData, 0, gamePlayData.feedbackAudios);
    
    this.monsterController = new MonsterController(this.riveMonsterElement, this.monsterPhaseNumber);

    this.inputManager = new GameplayInputManager(
      this.canvas,
      this.stoneHandler,
      this.puzzleHandler,
      this.monsterController
    );

    this.audioPlayer = new AudioPlayer();

    // Initialize Flow Manager
    this.flowManager = new GameplayFlowManager(
      this.levelData,
      this.data,
      this.jsonVersionNumber,
      this.monsterController,
      this.uiManager,
      this.puzzleHandler,
      this.stoneHandler,
      this.miniGameHandler,
      this.tutorial
    );

    this.addEventListeners();
    this.analyticsIntegration = AnalyticsIntegration.getInstance();
    
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      (isPause: boolean) => {
        this.isPauseButtonClicked = isPause;
        if (isPause) this.uiManager.openPausePopup();
      }
    );
    this.unsubscribeLoadGamePuzzle = gameStateService.subscribe(
      gameStateService.EVENTS.LOAD_NEXT_GAME_PUZZLE,
      (detail: any) => {
        this.flowManager.determineNextStep(detail?.isCorrect);
      });
    this.unsubscribeMiniGameEvent = miniGameStateService.subscribe(
      miniGameStateService.EVENTS.IS_MINI_GAME_DONE,
      ({ miniGameScore }: { miniGameScore: number }) => {
        this.flowManager.handleMiniGameDone(miniGameScore);
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
  // #endregion

  // #region Lifecycle
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

  private initializeGameComponents(gamePlayData) {
    this.stoneHandler = new StoneHandler(
      this.context,
      this.canvas,
      0, // Initial counter is 0
      this.levelData
    );
    this.tutorial = new TutorialHandler({
      context: this.context,
      width: this.width,
      height: this.height,
      puzzleLevel: 0,
      shouldHaveTutorial: gamePlayData?.tutorialOn
    });

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

  public dispose(): void {
    this.isDisposing = true;
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

    if (this.uiManager) {
      this.uiManager.dispose();
      this.uiManager = null;
    }

    if (this.tutorial) {
      this.tutorial.dispose();
      this.tutorial = null;
    }

    if (this.flowManager) {
        this.flowManager.dispose();
        this.flowManager = null;
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
      this.boundHandleVisibilityChange,
      false
    );
    this.removeEventListeners();

    // Clear game state
    this.pickedStone = null;
    this.pickedStoneObject = null;
  }
  // #endregion

  // #region Game Loop
  draw(deltaTime: number) {
    const timeRef = { value: this.time };
    this.tutorial?.handleTutorialAndGameStart({
      deltaTime,
      isGameStarted: this.isGameStarted,
      isPauseButtonClicked: this.isPauseButtonClicked,
      setGameToStart: this.setGameToStart.bind(this),
      timeRef
    });
    this.time = timeRef.value;

    const hasTutorial = this.tutorial.shouldShowQuickStartTutorial;
    const shouldStartTimer = this.tutorial.updateTutorialTimer(deltaTime);
    const canUpdateTimer = !hasTutorial || (shouldStartTimer && hasTutorial);

    this.uiManager.update(deltaTime, this.isGameStarted, this.isPauseButtonClicked, canUpdateTimer);

    // Main game logic only starts after isGameStarted = true
    if (this.isGameStarted) {
      this.handleStoneLetterDrawing();
      
      // Handle Timer Start SFX
      if (canUpdateTimer && !this.timerStartSFXPlayed && deltaTime > 1 && deltaTime <= 100) {
          this.audioPlayer.playAudio(AUDIO_PATH_POINTS_ADD);
          this.timerStartSFXPlayed = true; 
      }
    }

    this.tutorial.draw(deltaTime, this.isGameStarted);
  }

  private setGameToStart() {
    this.isGameStarted = true;
    this.time = 0;
    this.uiManager.setGameHasStarted(true);
  }

  public resumeGame(): void {
    // Resume the clock rotation when game is resumed
    this.uiManager.applyTimerRotation(this.uiManager.timerTicking?.startMyTimer && !this.uiManager.timerTicking?.isStoneDropped);
  }

  public pauseGamePlay(): void {
    this.audioPlayer.stopAllAudios();
    // Stop the clock rotation when game is paused
    this.uiManager.applyTimerRotation(false);
  }
  // #endregion

  // #region Event Handlers
  private handleInputDragStart(): void {
    this.tutorial.shouldShowQuickStartTutorial = false;
  }

  private handleInputMonsterClick(): void {
    this.setGameToStart();
    this.tutorial?.activeTutorial?.removeHandPointer();
    gameStateService.publish(
      gameStateService.EVENTS.GAME_HAS_STARTED,
      true
    );
  }

  private handleInputStoneDropOnTarget(detail: any): void {
    const { stone, stoneObject } = detail;
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
      promptText: this.uiManager.promptText,
      handleLetterDropEnd: (isCorrect, puzzleType) => {
        this.isFeedBackTriggered = isCorrect;
        this.flowManager.handleStoneDropResult(isCorrect, this.pickedStone);
      },
      triggerMonsterAnimation: (animationName) => this.monsterController.triggerMonsterAnimation(animationName),
      timerTicking: this.uiManager.timerTicking,
      lang,
      lettersCountRef,
      feedBackTexts: this.feedBackTexts,
    };

    this.puzzleHandler.createPuzzle(ctx);

    if (ctx.levelType === "Word" || ctx.levelType === "SoundWord") {
      this.stoneHandler.hideStone(stoneObject);
    }
    this.stonesCount = lettersCountRef.value;
    this.uiManager.setGameHasStarted(false);
  }

  private handleInputStoneDropMissed(detail: any): void {
    const { stone, stoneObject } = detail;
    this.stoneHandler.resetStonePosition(
      this.width,
      stone,
      stoneObject
    );
    this.monsterController.triggerMonsterAnimation('isMouthClosed');
    this.monsterController.triggerMonsterAnimation('backToIdle');
  }

  private handleInputRequestAnimation(detail: any): void {
    this.monsterController.triggerMonsterAnimation(detail.animationName);
  }

  private handleUiPauseClick(): void {
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
    this.pauseGamePlay();
  }

  private handleUiTimerEnded(isMyTimerOver: boolean): void {
    this.flowManager.determineNextStep(false, isMyTimerOver);
  }

  private handleUiPromptClick(): void {
    this.tutorial.shouldShowQuickStartTutorial = true;
    this.tutorial.quickStartTutorialReady = true;
  }

  private handleUiPopupRestart(): void {
    gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, {
        currentLevelData: this.levelData,
        selectedLevelNumber: this.levelNumber,
    });
    gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_GAME_PLAY_REPLAY);
  }

  private handleUiPopupSelectLevel(): void {
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
    gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_SELECT);
  }

  private handleUiPopupResume(): void {
    console.log("Resume");
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
    this.resumeGame();
  }

  public handleVisibilityChange(): void {
    this.audioPlayer.stopAllAudios();
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
    this.pauseGamePlay();
  }

  /**
   * Handles the game pause event.
   */
  private handleGamePause(): void {
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
    this.pauseGamePlay();
  }
  // #endregion

  // #region Private Helpers
  public setupBg(): void {
    // Determine the background type based on the level number using the static method
    const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(this.levelData.levelMeta.levelNumber);

    // Apply the logic to update the HTML or visual representation of the background
    const backgroundGenerator = new BackgroundHtmlGenerator();

    // Dynamically update the background based on the selected type
    backgroundGenerator.generateBackground(selectedBackgroundType);
  }

  setupMonsterPhaseBg() {
    // Determine the background type based on the monster phase number using the static method
    this.backgroundGenerator = new PhasesBackground();

    // Dynamically update the background based on the selected type
    this.backgroundGenerator.generateBackground(this.monsterController.currentPhase as any);
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

  private addEventListeners() {
    this.inputManager.addEventListeners(this.handler);
    this.eventListenersAdded = [];

    this.addEventListener(GameplayInputManager.INPUT_DRAG_START, this.handleInputDragStart.bind(this));
    this.addEventListener(GameplayInputManager.INPUT_MONSTER_CLICK, this.handleInputMonsterClick.bind(this));
    this.addEventListener(GameplayInputManager.INPUT_STONE_DROP_ON_TARGET, this.handleInputStoneDropOnTarget.bind(this));
    this.addEventListener(GameplayInputManager.INPUT_STONE_DROP_MISSED, this.handleInputStoneDropMissed.bind(this));
    this.addEventListener(GameplayInputManager.INPUT_REQUEST_ANIMATION, this.handleInputRequestAnimation.bind(this));
    
    // UI Events
    this.addEventListener(GameplayUIManager.UI_PAUSE_CLICK, this.handleUiPauseClick.bind(this));
    this.addEventListener(GameplayUIManager.UI_TIMER_ENDED, this.handleUiTimerEnded.bind(this));
    this.addEventListener(GameplayUIManager.UI_PROMPT_CLICK, this.handleUiPromptClick.bind(this));
    this.addEventListener(GameplayUIManager.UI_POPUP_RESTART, this.boundHandleUiPopupRestart);
    this.addEventListener(GameplayUIManager.UI_POPUP_SELECT_LEVEL, this.handleUiPopupSelectLevel.bind(this));
    this.addEventListener(GameplayUIManager.UI_POPUP_RESUME, this.handleUiPopupResume.bind(this));

    document.addEventListener(
      VISIBILITY_CHANGE,
      this.boundHandleVisibilityChange,
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
      this.boundHandleVisibilityChange,
      false
    );
  }
  // #endregion
}
