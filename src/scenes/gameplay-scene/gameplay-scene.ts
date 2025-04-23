import {
  TimerTicking,
  PromptText,
  PauseButton,
  LevelIndicators,
  StoneHandler,
  Tutorial,
  BackgroundHtmlGenerator,
  FeedbackTextEffects,
  AudioPlayer,
  TrailEffect,
  PhasesBackground
} from "@components";
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
  SCENE_NAME_LEVEL_END,
  PreviousPlayedLevel,
  MONSTER_PHASES
} from "@constants";
import { 
  BasePuzzleLogic, 
  PuzzleFactory, 
  FeedbackAudioHandler, 
  FeedbackType 
} from '@gamepuzzles';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import { PAUSE_POPUP_EVENT_DATA, PausePopupComponent } from '@components/popups/pause-popup/pause-popup-component';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';

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
  public tutorial: Tutorial;
  public id: string;
  public context: CanvasRenderingContext2D;
  public levelIndicators: LevelIndicators;
  public stonesCount: number = 1;
  public pickedStone: StoneConfig;
  public puzzleStartTime: number;
  pausePopupComponent: PausePopupComponent
  public showTutorial: boolean;
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
  feedbackTextEffects: FeedbackTextEffects;
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
  trailParticles: any;
  puzzleLogic: BasePuzzleLogic;
  feedbackAudioHandler: FeedbackAudioHandler;
  public riveMonsterElement: HTMLCanvasElement;
  public gameControl: HTMLCanvasElement;
  private unsubscribeEvent: () => void;
  public timeTicker: HTMLElement;
  isFeedBackTriggered: boolean;
  public monsterPhaseNumber: 0 | 1 | 2;
  private backgroundGenerator: PhasesBackground;
  public loadPuzzleDelay: 3000 | 4500;

  // Define animation delays as an array where index 0 = phase 0, index 1 = phase 1, index 2 = phase 2
  private animationDelays = [
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1500, isSad: 3000 }, // Phase 1
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1000, isSad: 2500 }, // Phase 2
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
    this.feedbackTextEffects = new FeedbackTextEffects();
    this.audioPlayer = new AudioPlayer();
    this.puzzleLogic = PuzzleFactory.createPuzzleLogic(this.levelData, this.counter);
    this.feedbackAudioHandler = new FeedbackAudioHandler(gamePlayData.feedbackAudios);
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
          gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_GAME_PLAY);
          break;
        case PAUSE_POPUP_EVENT_DATA.SELECT_LEVEL:
          gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
          gameStateService.publish(gameStateService.EVENTS.SWITCH_SCENE_EVENT, SCENE_NAME_LEVEL_SELECT)
        default:
          gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
          this.resumeGame();
      }
    });
    this.setupMonsterPhaseBg();
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
    this.trailParticles = new TrailEffect(this.canvas);
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
      this.levelData,
      gamePlayData.feedbackAudios,
      this.timerTicking
    );
    this.tutorial = new Tutorial(this.context, this.width, this.height);
    this.promptText = new PromptText(
      this.width,
      this.height,
      this.levelData.puzzles[this.counter],
      this.levelData,
      this.rightToLeft
    );
    this.levelIndicators = new LevelIndicators();
    this.levelIndicators.setIndicators(this.counter);
    this.monster = this.initializeRiveMonster();
  }

  private setupUIElements() {
    const { canvasElem, canvasWidth, canvasHeight, gameCanvasContext, gameControlElem } = gameSettingsService.getCanvasSizeValues();
    const riveMonsterElement = gameSettingsService.getRiveCanvasValue();
    this.handler = canvasElem;
    this.riveMonsterElement = riveMonsterElement;
    this.riveMonsterElement.style.zIndex = "4";
    this.gameControl = gameControlElem;
    this.gameControl.style.zIndex = "5";

    this.canvas = canvasElem
    this.width = canvasWidth;
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

  getRandomFeedBackText(randomIndex: number): string {
    const keys = Object.keys(this.feedBackTexts);
    const selectedKey = keys[randomIndex];
    return this.feedBackTexts[selectedKey] as string;
  }

  getRandomInt(min: number, max: number): number {
    const feedbackValues = Object.values(this.feedBackTexts);
    const definedValuesMaxCount =
      feedbackValues.filter((value) => value != undefined).length - 1;
    return Math.floor(Math.random() * (definedValuesMaxCount - min + 1)) + min;
  }


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
    if (this.monster.checkHitboxDistance(event) && this.pickedStone) {
      const { text } = this.pickedStone; // Use destructuring for clarity
      switch (this.levelData.levelMeta.levelType) {
        case "LetterOnly":
        case "LetterInWord":
          this.letterPuzzle(text);
          break;
        case "Word":
        case "SoundWord":
          this.wordPuzzle(this.pickedStone);
          break;
      }
    } else {
      // Use stone-handler.ts method resetStonePosition instead of manual reset
      if (
        this.pickedStone &&
        this.pickedStoneObject &&
        this.pickedStone.text &&
        typeof this.pickedStoneObject.origx === "number" &&
        typeof this.pickedStoneObject.origy === "number"
      ) {
        this.stoneHandler.resetStonePosition(
          this.width,
          this.pickedStone,
          this.pickedStoneObject
        );
        // Trigger animations
        this.triggerMonsterAnimation('isMouthClosed');
        this.triggerMonsterAnimation('backToIdle');
      }
    }
    this.pickedStone = null;
    this.puzzleLogic.clearPickedUp();
    gameSettingsService.publish(
      gameSettingsService.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT,
      false
    );
  };

  // Event to identify mouse moved down on the canvas
  handleMouseDown = (event) => {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }

    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Unified: Always delegate to puzzleLogic for stone picking
    const picked = this.puzzleLogic.handlePickStoneUp(x, y, this.stoneHandler);
    if (picked) {
      this.pickedStoneObject = picked;
      this.pickedStone = picked;
      this.stoneHandler.playDragAudioIfNecessary(picked);
      // Restore grouping/merging for word puzzles
      if (this.puzzleLogic.checkIsWordPuzzle()) {
        this.puzzleLogic.setPickUpLetter(picked?.text, picked?.foilStoneIndex);
      }
    }

    gameSettingsService.publish(gameSettingsService.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT, true);
  };

  setPickedUp(x, y) {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }

    // Unified: Always delegate to puzzleLogic for stone picking
    const stoneLetter = this.puzzleLogic.handlePickStoneUp(x, y, this.stoneHandler);

    if (stoneLetter) {
      this.pickedStoneObject = stoneLetter;
      this.pickedStone = stoneLetter;
      this.stoneHandler.playDragAudioIfNecessary(stoneLetter);

      // Puzzle-specific logic for word puzzles
      if (this.puzzleLogic.checkIsWordPuzzle()) {
        this.puzzleLogic.setPickUpLetter(
          stoneLetter?.text,
          stoneLetter?.foilStoneIndex
        );
      }
    }
  }

  handleMouseMove = (event) => {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }

    let trailX = event.clientX;
    let trailY = event.clientY

    if (this.pickedStone) {
      const moveResult = this.puzzleLogic.handleStoneMove(
        event,
        this.pickedStone,
        this.pickedStoneObject,
        this.stoneHandler,
        this.width
      );
      this.pickedStone = moveResult.pickedStone;
      this.pickedStoneObject = moveResult.pickedStoneObject;
      trailX = moveResult.trailX;
      trailY = moveResult.trailY;
      // Trigger open mouth animation
      this.triggerMonsterAnimation('isMouthOpen');
    }
    this.trailParticles?.addTrailParticlesOnMove(trailX, trailY);
  };

  handleMouseClick = (event) => {
    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.monster.onClick(x, y)) {
      this.isGameStarted = true;
      this.time = 0;
      this.tutorial.setPlayMonsterClickAnimation(false);
    }

    // Use the play button in the HTML implementation instead of onClick
    const promptPlayButton = document.getElementById('prompt-play-button');
    if (promptPlayButton && promptPlayButton.contains(event.target as Node)) {
      this.promptText.playSound();
    }
  };

  // Event to identify touch on the canvas
  handleTouchStart = (event) => {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }
    const touch = event.touches[0];
    this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    this.trailParticles?.resetParticles();
  };

  handleTouchMove = (event) => {
    const touch = event.touches[0];
    this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    this.trailParticles?.addTrailParticlesOnMove(touch.clientX, touch.clientY);
  };

  handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    this.trailParticles?.resetParticles();
  };

  draw(deltaTime: number) {
    if (!this.isGameStarted && !this.isPauseButtonClicked) {
      this.time = this.time + deltaTime;
      if (this.time >= 5000) {
        this.isGameStarted = true;
        this.time = 0;
        this.tutorial.setPlayMonsterClickAnimation(false);
      }
    }
    // The promptText.draw method has been removed as it's now handled by HTML/CSS
    this.trailParticles?.draw();
    if (this.isPauseButtonClicked && this.isGameStarted) {
      this.handleStoneLetterDrawing(deltaTime);
    }
    if (!this.isPauseButtonClicked && !this.isGameStarted) {
      this.counter == 0
        ? this.tutorial.clickOnMonsterTutorial(deltaTime)
        : undefined;
    }
    if (!this.isPauseButtonClicked && this.isGameStarted) {
      this.handleStoneLetterDrawing(deltaTime);
    }
  }

  private handleStoneLetterDrawing(deltaTime) {
    this.puzzleLogic.drawStones(deltaTime, this.stoneHandler);
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
        return;
      }

      const timeoutId = setTimeout(handleLevelEnd, this.loadPuzzleDelay); // added delay for switching to level end screen
      if (this.isFeedBackTriggered) {
        const audioSources = this.audioPlayer?.audioSourcs || [];
        const lastAudio = audioSources[audioSources.length - 1];
        if (lastAudio) {
          lastAudio.onended = () => {
            clearTimeout(timeoutId);
            handleLevelEnd();
          };
        }
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
    this.monster = this.initializeRiveMonster();
    this.removeEventListeners();
    this.isGameStarted = false;
    this.time = 0;
    this.loadPuzzleDelay = 4500;
    this.puzzleLogic.updatePuzzleLevel(loadPuzzleEvent?.detail?.counter);
    this.pickedStone = null;
    document.dispatchEvent(loadPuzzleEvent);
    this.addEventListeners();
    this.audioPlayer.stopAllAudios();
    this.startPuzzleTime();
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

    if (this.trailParticles) {
      this.trailParticles.clearTrailSubscription();
      this.trailParticles = null;
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

  private checkStoneDropped(stone, feedBackIndex, isWord = false) {
    // Use the WordPuzzleLogic to check if the letter drop is correct
    return this.puzzleLogic.isLetterDropCorrect(stone, isWord);
  }

  public letterPuzzle(droppedStone: string) {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect = this.checkStoneDropped(
      droppedStone,
      feedBackIndex
    );

    // Process the feedback audio using our new FeedbackAudioHandler
    this.feedbackAudioHandler.playFeedback(
      isCorrect ? FeedbackType.CORRECT_ANSWER : FeedbackType.INCORRECT,
      feedBackIndex
    );

    if (isCorrect) {
      this.handleCorrectStoneDrop(feedBackIndex);
    }

    this.isFeedBackTriggered = true;

    this.handleStoneDropEnd(isCorrect);
  }

  public wordPuzzle(droppedStoneInstance: StoneConfig) {
    if (droppedStoneInstance.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }
    this.audioPlayer.stopFeedbackAudio();
    droppedStoneInstance.x = -999;
    droppedStoneInstance.y = -999;
    const feedBackIndex = this.getRandomInt(0, 1);
    this.puzzleLogic.setGroupToDropped();
    const { droppedLetters } = this.puzzleLogic.getValues();
    const isCorrect = this.puzzleLogic.validateFedLetters();

    // Process the feedback audio using our new FeedbackAudioHandler
    const isComplete = droppedLetters === this.puzzleLogic.getCorrectTargetStone();
    const feedbackType = isCorrect 
      ? (isComplete ? FeedbackType.CORRECT_ANSWER : FeedbackType.PARTIAL_CORRECT)
      : FeedbackType.INCORRECT;
    
    this.feedbackAudioHandler.playFeedback(feedbackType, feedBackIndex);

    if (isCorrect) {
      if (this.puzzleLogic.validateWordPuzzle()) {
        this.handleCorrectStoneDrop(feedBackIndex);
        this.handleStoneDropEnd(isCorrect, "Word");
        this.stonesCount = 1;
        return;
      }
      this.triggerMonsterAnimation('isMouthClosed');
      this.triggerMonsterAnimation('backToIdle');
      this.timerTicking.startTimer();
      // // Trigger animations via fire
      // this.triggerMonsterAnimation('isHappy',3000)
      const { droppedHistory } = this.puzzleLogic.getValues();
      const droppedStonesCount = Object.keys(droppedHistory).length;
      this.promptText.droppedStoneIndex(
        lang == "arabic"
          ? this.stonesCount
          : droppedStonesCount
      );
      this.stonesCount++;
    } else {
      this.handleStoneDropEnd(isCorrect, "Word");
      this.stonesCount = 1;
    }
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
    setTimeout(() => {
      this.adjustLoadPuzzleDelay(isCorrect);
      this.loadPuzzle();
    }, isCorrect ? 0 : 2000);
  }

  private adjustLoadPuzzleDelay(isCorrect) {
    //Adjust the delay of 4500 (4.5 seconds) to 2500 (2.5 seconds) if the puzzle is incorrect.
    this.loadPuzzleDelay = isCorrect ? 4500 : 3000;
  }

  private handleCorrectStoneDrop = (feedbackIndex: number): void => {
    this.score += 100;
    const feedbackText = this.getRandomFeedBackText(feedbackIndex);

    // Show feedback text immediately
    this.feedbackTextEffects.wrapText(feedbackText);

    // Wait for feedback audio to finish
    const totalAudioDuration = 4500; // Approximate total duration of all feedback audio (eating + cheering + points)
    setTimeout(() => {
      this.feedbackTextEffects.hideText();
    }, totalAudioDuration);
  };

  private dispatchStoneDropEvent(isCorrect: boolean): void {
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: { isCorrect: isCorrect },
    });

    document.dispatchEvent(dropStoneEvent);
  }

  public logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string) {
    let endTime = Date.now();
    const { droppedLetters } = this.puzzleLogic.getValues();
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
}