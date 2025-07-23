import {
  TimerTicking,
  PromptText,
  PauseButton,
  LevelIndicators,
  StoneHandler,
  BackgroundHtmlGenerator,
  AudioPlayer,
  PhasesBackground,
  TrailEffectsHandler
} from "@components";
import TutorialHandler from '@tutorials';
import {
  StoneConfig,
  CLICK,
  LOADPUZZLE,
  MOUSEDOWN,
  MOUSEMOVE,
  MOUSEUP,
  STONEDROP,
  TOUCHEND,
  TOUCHMOVE,
  TOUCHSTART,
  VISIBILITY_CHANGE,
  Debugger,
  lang,
  pseudoId,
  Utils,
  getGameTypeName,
} from "@common";
import { GameScore, DataModal } from "@data";
import {
  LevelCompletedEvent,
  PuzzleCompletedEvent,
} from "../../Firebase/firebase-event-interface";
import { FirebaseIntegration } from "../../Firebase/firebase-integration";
import {
  SCENE_NAME_LEVEL_SELECT,
  SCENE_NAME_GAME_PLAY,
  SCENE_NAME_GAME_PLAY_REPLAY,
  SCENE_NAME_LEVEL_END,
  PreviousPlayedLevel,
  MONSTER_PHASES,
  AUDIO_PATH_POINTS_ADD
} from "@constants";
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import { PAUSE_POPUP_EVENT_DATA, PausePopupComponent } from '@components/popups/pause-popup/pause-popup-component';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import PuzzleHandler from "@gamepuzzles/puzzleHandler/puzzleHandler";
import { DEFAULT_SELECTORS } from '@components/prompt-text/prompt-text';

export class GameplayScene {
  public width: number;
  public height: number;
  public monster: RiveMonsterComponent;
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
  public triggerInputs: any;
  audioPlayer: AudioPlayer;
  firebaseIntegration: FirebaseIntegration;
  startTime: number;
  puzzleTime: number;
  isDisposing: boolean;
  trailEffectHandler: TrailEffectsHandler;
  public riveMonsterElement: HTMLCanvasElement;
  public gameControl: HTMLCanvasElement;
  private unsubscribeEvent: () => void;
  public timeTicker: HTMLElement;
  isFeedBackTriggered: boolean;
  public monsterPhaseNumber: 0 | 1 | 2;
  private backgroundGenerator: PhasesBackground;
  public loadPuzzleDelay: 3000 | 4500;
  private puzzleHandler: any;
  private timerStartSFXPlayed: boolean;
  private isMonsterMouthOpen = false;
  private lastClientX = 0;
  private lastClientY = 0;
  private animationFrameId: number | null = null;
  // Define animation delays as an array where index 0 = phase 0, index 1 = phase 1, index 2 = phase 2
  private animationDelays = [
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1500, isSad: 3000 }, // Phase 1
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1000, isSad: 2500 }, // Phase 2
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1300, isSad: 2600 }, // Phase 3
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 100, isSad: 2500 }  // Phase 4
  ];

  constructor() {
    const gamePlayData = gameStateService.getGamePlaySceneDetails();
    this.pausePopupComponent = new PausePopupComponent();
    // Assign state properties based on game state
    this.initializeProperties(gamePlayData);
    // UI element setup
    this.setupUIElements();
    this.isDisposing = false;
    // Initialize additional game elements
    this.initializeGameComponents(gamePlayData);
    var previousPlayedLevel: string = this.levelData.levelMeta.levelNumber;
    Debugger.DebugMode
      ? localStorage.setItem(
        PreviousPlayedLevel + lang + "Debug",
        previousPlayedLevel
      )
      : localStorage.setItem(PreviousPlayedLevel + lang, previousPlayedLevel);
    this.addEventListeners();
    this.startGameTime();
    this.startPuzzleTime();
    this.firebaseIntegration = new FirebaseIntegration();
    this.audioPlayer = new AudioPlayer();
    this.puzzleHandler = new PuzzleHandler(this.levelData, this.counter, gamePlayData.feedbackAudios);
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      (isPause: boolean) => {
        this.isPauseButtonClicked = isPause;
        if (isPause) this.pausePopupComponent.open();
      }
    );
    this.loadPuzzleDelay = 4500;
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
  }

  private initializeRiveMonster(): RiveMonsterComponent {
    return new RiveMonsterComponent({
      canvas: this.riveMonsterElement,
      autoplay: true,
      fit: "contain",
      alignment: "bottomCenter",
      gameCanvas: this.canvas,
      src: MONSTER_PHASES[this.monsterPhaseNumber],
    });
  }

  private initializeGameComponents(gamePlayData) {
    this.trailEffectHandler = new TrailEffectsHandler(this.canvas)
    this.pauseButton = new PauseButton();
    this.pauseButton.onClick(() => {
      gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
      this.pauseGamePlay();
    });
    this.timerTicking = new TimerTicking(this.width, this.height, this.loadPuzzle);
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
      gamePlayData?.tutorialOn && this.counter === 0,
      onClickCallback,
    );
    this.levelIndicators = new LevelIndicators();
    this.levelIndicators.setIndicators(this.counter);
    this.monster = this.initializeRiveMonster();

    //For shouldShowQuickStartTutorial- If the game level should have tutorial AND level is not yet cleared, timer should be delayed.
    this.tutorial.shouldShowQuickStartTutorial = gamePlayData.tutorialOn && !gamePlayData.isTutorialCleared;

    if (this.tutorial.showHandPointerInAudioPuzzle(gamePlayData.levelData)) {
      this.tutorial.resetQuickStartTutorialDelay();
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
    this.backgroundGenerator.generateBackground(this.monsterPhaseNumber);
  }

  resumeGame = () => {
    this.addEventListeners();
    // Resume the clock rotation when game is resumed
    this.timerTicking?.applyRotation(this.timerTicking?.startMyTimer && !this.timerTicking?.isStoneDropped);
  };

  private triggerMonsterAnimation(animationName: string) {
    const delay = this.animationDelays[this.monsterPhaseNumber]?.[animationName] ?? 0;

    if (delay > 0) {
      setTimeout(() => {
        this.monster.triggerInput(animationName);
      }, delay);
    } else {
      this.monster.triggerInput(animationName);
    }
  }

  handleMouseUp = (event) => {
    // Cancel any pending animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset monster mouth state
    this.isMonsterMouthOpen = false;

    if (!this.pickedStone || this.pickedStone.frame <= 99) {
      this.puzzleHandler.clearPickedUp();
      return;
    }

    if (this.monster.checkHitboxDistance(event)) {
      // Handle letter drop (success case)
      const lettersCountRef = { value: this.stonesCount };
      const ctx = {
        levelType: this.levelData.levelMeta.levelType,
        pickedLetter: {
          text: this.pickedStone.text,
          frame: this.pickedStone.frame
        },
        targetLetterText: this.stoneHandler.getCorrectTargetStone(), // Pass only the data needed
        handleLetterDropEnd: (isCorrect, puzzleType) => {
          this.isFeedBackTriggered = isCorrect;
          if (isCorrect) {
            this.score += 100; //100 as static default value for adding score.
          }
          this.handleStoneDropEnd(isCorrect, puzzleType);
        },
        triggerMonsterAnimation: this.triggerMonsterAnimation.bind(this),
        timerTicking: this.timerTicking,
        lang,
        lettersCountRef,
        feedBackTexts: this.feedBackTexts
      };

      this.puzzleHandler.createPuzzle(ctx);

      // For Word puzzles, hide the letter immediately after dropping it into the monster
      if (ctx.levelType === "Word" || ctx.levelType === "SoundWord") {
        this.stoneHandler.hideStone(this.pickedStoneObject);
      }
      this.stonesCount = lettersCountRef.value;
      this.trailEffectHandler.setGameHasStarted(false);
    } else if (this.pickedStoneObject) {
      // Handle letter drop (fail/miss case)
      this.stoneHandler.resetStonePosition(
        this.width,
        this.pickedStone,
        this.pickedStoneObject
      );
      this.triggerMonsterAnimation('isMouthClosed');
      this.triggerMonsterAnimation('backToIdle');
    }

    // Clear stored coordinates
    this.lastClientX = 0;
    this.lastClientY = 0;

    this.pickedStone = null;
    this.puzzleHandler.clearPickedUp();
  };

  // Event to identify mouse moved down on the canvas
  handleMouseDown = (event) => {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the letter is animating
    }

    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!this.puzzleHandler.checkIsWordPuzzle()) {
      // Use stoneHandler's handlePickStoneUp for LetterOnly puzzles
      const picked = this.stoneHandler.handlePickStoneUp(x, y);
      if (picked) {
        this.pickedStoneObject = picked;
        this.pickedStone = picked;
        this.stoneHandler.playDragAudioIfNecessary(picked);
      }
    } else {
      this.setPickedUp(x, y);
    }
  };

  setPickedUp(x, y) {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the letter is animating
    }

    const stoneLetter = this.stoneHandler.handlePickStoneUp(x, y);

    if (stoneLetter) {
      this.pickedStoneObject = stoneLetter;
      this.pickedStone = stoneLetter;
      this.stoneHandler.playDragAudioIfNecessary(stoneLetter);

      if (this.levelData?.levelMeta?.levelType === 'Word') {
        this.puzzleHandler.setPickUpLetter(
          stoneLetter?.text,
          stoneLetter?.foilStoneIndex
        );
      }
    }
  }

  handleMouseMove = (event) => {
    // Store the latest coordinates even if we don't process this event
    this.lastClientX = event.clientX;
    this.lastClientY = event.clientY;

    // Early returns for invalid states
    if (!this.pickedStone || this.pickedStone.frame <= 99) return; // Prevent dragging if the letter is animating

    // Schedule the next animation frame if not already scheduled
    this.requestDragUpdate();
  };

  /**
   * Requests an animation frame for drag updates.
   * Uses requestAnimationFrame for optimal performance and visual smoothness.
   */
  private requestDragUpdate() {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        // Clear the ID first to allow scheduling of the next frame
        this.animationFrameId = null;
        // Use a small coordinator method to delegate to specialized handlers
        this.dispatchDragUpdate(this.lastClientX, this.lastClientY);
      });
    }
  };

  /**
   * Dispatches drag updates to the appropriate specialized processor based on puzzle type.
   * Acts as a thin coordinator that routes to specialized processing methods.
   * 
   * @param clientX - The client X coordinate of the mouse/touch position
   * @param clientY - The client Y coordinate of the mouse/touch position
   */
  private dispatchDragUpdate(clientX: number, clientY: number) {
    // Disable quick start tutorial animation since user has started interacting
    this.tutorial.shouldShowQuickStartTutorial = false;
    
    // Determine which processing method to call based on puzzle type
    if (!this.puzzleHandler.checkIsWordPuzzle()) {
      this.processSimpleDragMovement(clientX, clientY);
    } else {
      this.processWordPuzzleDragMovement(clientX, clientY);
    }
  }
  
  /**
   * Processes simple drag movement for matchfirst puzzles (LetterOnly/LetterInWord).
   * This is a streamlined path with direct coordinate updates and no hover detection.
   * 
   * @param clientX - The client X coordinate of the mouse/touch position
   * @param clientY - The client Y coordinate of the mouse/touch position
   */
  private processSimpleDragMovement(clientX: number, clientY: number) {
    // Direct coordinate update without complex hover detection
    let newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
      this.pickedStone,
      clientX,
      clientY
    );
    this.pickedStone = newStoneCoordinates;

    // Only trigger monster animation if not already open
    if (!this.isMonsterMouthOpen) {
      this.triggerMonsterAnimation('isMouthOpen');
      this.isMonsterMouthOpen = true;
    }
  }

  /**
   * Processes complex drag movement for word puzzles with hover detection.
   * Delegates to specialized methods for updating coordinates, checking hover, and handling letter pickup.
   * 
   * @param clientX - The client X coordinate of the mouse/touch position
   * @param clientY - The client Y coordinate of the mouse/touch position
   */
  private processWordPuzzleDragMovement(clientX: number, clientY: number) {
    // Update stone coordinates and get trail position
    const { trailX, trailY } = this.updateDraggedStonePosition(clientX, clientY);
    
    // Check for hovering over other stones
    const newStoneLetter = this.checkStoneHovering(trailX, trailY);
    
    // Handle letter pickup if hovering detected
    if (newStoneLetter) {
      this.handleLetterPickup(newStoneLetter);
    }
    
    // Ensure monster mouth is open during dragging
    this.ensureMonsterMouthOpen();
  }
  
  /**
   * Updates the position of the currently dragged stone.
   * 
   * @param clientX - The client X coordinate of the mouse/touch position
   * @param clientY - The client Y coordinate of the mouse/touch position
   * @returns Object containing trail X and Y coordinates for hover detection
   */
  private updateDraggedStonePosition(clientX: number, clientY: number): { trailX: number, trailY: number } {
    const newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
      this.pickedStone,
      clientX,
      clientY
    );
    this.pickedStone = newStoneCoordinates;
    
    return {
      trailX: newStoneCoordinates.x,
      trailY: newStoneCoordinates.y
    };
  }
  
  /**
   * Checks if the dragged stone is hovering over another stone.
   * 
   * @param trailX - The X coordinate of the dragged stone
   * @param trailY - The Y coordinate of the dragged stone
   * @returns The new stone letter object if hovering, otherwise null
   */
  private checkStoneHovering(trailX: number, trailY: number) {
    return this.stoneHandler.handleHoveringToAnotherStone(
      trailX,
      trailY,
      (foilStoneText, foilStoneIndex) => {
        return this.puzzleHandler.handleCheckHoveredLetter(foilStoneText, foilStoneIndex);
      }
    );
  }
  
  /**
   * Handles the letter pickup process when hovering over a valid stone.
   * Updates puzzle state, resets original stone position, and replaces with new letter.
   * 
   * @param newStoneLetter - The new stone letter object to pick up
   */
  private handleLetterPickup(newStoneLetter: any) {
    // Update puzzle state with the picked up letter
    this.puzzleHandler.setPickUpLetter(
      newStoneLetter.text,
      newStoneLetter.foilStoneIndex
    );
    
    // Reset the original stone position
    this.pickedStone = this.stoneHandler.resetStonePosition(
      this.width,
      this.pickedStone,
      this.pickedStoneObject
    );
    
    // Replace with the new letter
    this.pickedStoneObject = newStoneLetter;
    this.pickedStone = newStoneLetter;
  }
  
  /**
   * Ensures the monster mouth is open during dragging.
   * Only triggers the animation if the mouth isn't already open.
   */
  private ensureMonsterMouthOpen() {
    if (!this.isMonsterMouthOpen) {
      this.triggerMonsterAnimation('isMouthOpen');
      this.isMonsterMouthOpen = true;
    }
  }

  handleMouseClick = (event) => {
    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.monster.onClick(x, y)) {
      this.setGameToStart();
      this.tutorial?.activeTutorial?.removeHandPointer();
    }
  };

  // Event to identify touch on the canvas
  handleTouchStart = (event) => {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the letter is animating
    }
    const touch = event.touches[0];
    this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };

  handleTouchMove = (event) => {
    if (!this.pickedStone) return;
    event.preventDefault(); // Prevent scrolling while dragging

    // Convert touch event to mouse event format
    const touch = event.touches[0];
    // Store coordinates and let handleMouseMove handle the throttling
    this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
  };

  private setGameToStart() {
    this.isGameStarted = true;
    this.time = 0;
    this.trailEffectHandler.setGameHasStarted(true);
  }

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

  addEventListeners() {
    this.handler.addEventListener(MOUSEUP, this.handleMouseUp, false);
    this.handler.addEventListener(MOUSEMOVE, this.handleMouseMove, false);
    this.handler.addEventListener(MOUSEDOWN, this.handleMouseDown, false);
    this.handler.addEventListener(TOUCHSTART, this.handleTouchStart, false);
    this.handler.addEventListener(TOUCHMOVE, this.handleTouchMove, false);
    this.handler.addEventListener(TOUCHEND, this.handleTouchEnd, false);
    this.handler.addEventListener(CLICK, this.handleMouseClick, false);

    document.addEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
  }

  removeEventListeners() {
    // Remove event listeners using the defined functions
    this.handler.removeEventListener(CLICK, this.handleMouseClick, false);
    this.handler.removeEventListener("mouseup", this.handleMouseUp, false);
    this.handler.removeEventListener("mousemove", this.handleMouseMove, false);
    this.handler.removeEventListener("mousedown", this.handleMouseDown, false);
    this.handler.removeEventListener(
      "touchstart",
      this.handleTouchStart,
      false
    );
    this.handler.removeEventListener("touchmove", this.handleTouchMove, false);
    this.handler.removeEventListener("touchend", this.handleTouchEnd, false);
  }

  loadPuzzle = (isTimerEnded?) => {
    this.removeEventListeners();

    this.stonesCount = 1;
    const timerEnded = Boolean(isTimerEnded);
    if (timerEnded) {
      this.logPuzzleEndFirebaseEvent(false);
    }
    this.counter += 1; //increment Puzzle
    this.isGameStarted = false;
    this.tutorial.resetTutorialTimer();
    // Reset the 6-second tutorial delay timer each time a new puzzle is loaded
    this.tutorial.resetQuickStartTutorialDelay();
    
    if (this.counter === this.levelData.puzzles.length) {
      const handleLevelEnd = () => {
        this.levelIndicators.setIndicators(this.counter);
        this.logLevelEndFirebaseEvent();
        GameScore.setGameLevelScore(this.levelData, this.score);

        const levelEndData = {
          starCount: GameScore.calculateStarCount(this.score),
          currentLevel: this.levelNumber,
          isTimerEnded: timerEnded
        }

        gameStateService.publish(gameStateService.EVENTS.LEVEL_END_DATA_EVENT, { levelEndData, data: this.data });
        gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_END);
        this.monster.dispose(); //Adding the monster dispose here due to the scenario that this.monster is still needed when restart game level is played.
      };

      if (timerEnded) {
        handleLevelEnd();
      } else {
        //Trigger the handleLevelEnd with a delay to let the audio play in puzzleHandler.ts before switching to level end screen.
        setTimeout(handleLevelEnd, this.loadPuzzleDelay);
      }
    } else {
      const loadPuzzleEvent = new CustomEvent(LOADPUZZLE, {
        detail: {
          counter: this.counter,
        },
      });
      setTimeout(
        () => {
          if (!this.isDisposing) {
            this.initNewPuzzle(loadPuzzleEvent);
            this.timerTicking.startTimer(); // Start the timer for the new puzzle
          }
        },
        timerEnded ? 0 : this.loadPuzzleDelay // added delay for switching to level end screen
      );
    }
  };

  private initNewPuzzle(loadPuzzleEvent) {
    // Dispose old monster first to prevent memory leaks
    if (this.monster) {
      this.monster.dispose();
    }
    this.timerStartSFXPlayed = false; // move this flag from loadpuzzle to initnewpuzzle to make sure when loading new puzzle, timer start sfx will set to false.
    this.stoneHandler.stonesHasLoaded = false;
    this.monster = this.initializeRiveMonster();
    this.removeEventListeners();
    this.isGameStarted = false;
    this.time = 0;
    this.loadPuzzleDelay = 4500;
    // Ensure puzzleHandler is set up for new puzzle
    this.puzzleHandler.initialize(this.levelData, this.counter);
    this.pickedStone = null;
    document.dispatchEvent(loadPuzzleEvent);
    this.addEventListeners();
    this.audioPlayer.stopAllAudios();
    this.startPuzzleTime();
    this.tutorial.resetQuickStartTutorialDelay();
  }

  public dispose = () => {
    this.isDisposing = true;

    // Cleanup audio
    if (this.audioPlayer) {
      this.audioPlayer.stopAllAudios();
      this.audioPlayer = null;
    }

    // Dispose visual elements
    if (this.monster) {
      this.monster.dispose();
      this.monster = null;
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
    const triggerInputs = this.monster.getInputs();
    const isHappy = triggerInputs.find(input => input.name === 'isHappy');
    const isSpit = triggerInputs.find(input => input.name === 'isSpit');
    const isSad = triggerInputs.find(input => input.name === 'isSad');
    const isChewing = triggerInputs.find(input => input.name === 'isChewing');
    if (!isChewing) {
      console.error("Missing triggers for animations.");
      return false;
    }
    if (!isHappy || !isSpit || !isSad) {
      console.error("Missing triggers for animations.");
      return false;
    }
    if (isCorrect) {
      this.triggerMonsterAnimation('isChewing');
      this.triggerMonsterAnimation('isHappy');
    } else {
      this.triggerMonsterAnimation('isChewing');
      this.triggerMonsterAnimation('isSpit');
      this.triggerMonsterAnimation('isSad');
    }

    this.logPuzzleEndFirebaseEvent(isCorrect, puzzleType);
    this.dispatchStoneDropEvent(isCorrect);
    this.tutorial.hideTutorial(); // Turn off tutorial
    setTimeout(() => {
      //Adjust the delay of 4500 (4.5 seconds) to 2500 (2.5 seconds) if the puzzle is incorrect.
      this.loadPuzzleDelay = isCorrect ? 4500 : 3000;
      this.loadPuzzle();
    }, isCorrect ? 0 : 2000);
  }

  private dispatchStoneDropEvent(isCorrect: boolean): void {
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: { isCorrect: isCorrect },
    });

    document.dispatchEvent(dropStoneEvent);
  }

  public logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string) {
    let endTime = Date.now();
    const droppedLetters = this.puzzleHandler.getWordPuzzleDroppedLetters();
    const puzzleCompletedData: PuzzleCompletedEvent = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number: this.jsonVersionNumber,
      success_or_failure: isCorrect ? "success" : "failure",
      level_number: this.levelData.levelMeta.levelNumber,
      puzzle_number: this.counter,
      item_selected:
        puzzleType == "Word"
          ? droppedLetters == null ||
            droppedLetters == undefined
            ? "TIMEOUT"
            : droppedLetters
          : this.pickedStone == null || this.pickedStone == undefined
            ? "TIMEOUT"
            : this.pickedStone?.text,
      target: this.stoneHandler.getCorrectTargetStone(),
      foils: this.stoneHandler.getFoilStones(),
      response_time: (endTime - this.puzzleTime) / 1000,
    };
    this.firebaseIntegration.sendPuzzleCompletedEvent(puzzleCompletedData);
  }

  public logLevelEndFirebaseEvent() {
    let endTime = Date.now();
    const levelCompletedData: LevelCompletedEvent = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: document.getElementById("version-info-id").innerHTML,
      json_version_number: this.jsonVersionNumber,
      success_or_failure:
        GameScore.calculateStarCount(this.score) >= 3 ? "success" : "failure",
      number_of_successful_puzzles: this.score / 100,
      level_number: this.levelData.levelMeta.levelNumber,
      duration: (endTime - this.startTime) / 1000,
    };
    this.firebaseIntegration.sendLevelCompletedEvent(levelCompletedData);
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