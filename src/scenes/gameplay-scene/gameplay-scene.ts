import {
  TimerTicking,
  PromptText,
  PauseButton,
  LevelIndicators,
  StoneHandler,
  BackgroundHtmlGenerator,
  FeedbackTextEffects,
  AudioPlayer,
  PhasesBackground,
  TrailEffectsHandler
} from "@components";
import { LetterPuzzleTutorial } from '@tutorials';
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
import { WordPuzzleLogic } from '@gamepuzzles';
import gameStateService from '@gameStateService';
import gameSettingsService from '@gameSettingsService';
import { PAUSE_POPUP_EVENT_DATA, PausePopupComponent } from '@components/popups/pause-popup/pause-popup-component';
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import PuzzleHandler from "@gamepuzzles/puzzleHandler/puzzleHandler";

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
  public tutorial: LetterPuzzleTutorial;
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
  trailEffectHandler: TrailEffectsHandler;
  wordPuzzleLogic: any;
  public riveMonsterElement: HTMLCanvasElement;
  public gameControl: HTMLCanvasElement;
  private unsubscribeEvent: () => void;
  public timeTicker: HTMLElement;
  isFeedBackTriggered: boolean;
  public monsterPhaseNumber: 0 | 1 | 2;
  private backgroundGenerator: PhasesBackground;
  public loadPuzzleDelay: 3000 | 4500;
  private puzzleHandler: any; 


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
    this.puzzleHandler = new PuzzleHandler(this.levelData, this.counter); 
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
    //this.setupBg(); //Temporary disabled to try evolution background.
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
      this.levelData,
      gamePlayData.feedbackAudios,
      this.timerTicking
    );
    this.tutorial = new LetterPuzzleTutorial(this.context, this.width, this.height);
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
      const stonesCountRef = { value: this.stonesCount };
      this.puzzleHandler.createPuzzle({
        levelType: this.levelData.levelMeta.levelType,
        pickedStone: this.pickedStone,
        stoneHandler: this.stoneHandler,
        audioPlayer: this.audioPlayer,
        promptText: this.promptText,
        handleCorrectStoneDrop: (feedbackIndex) => this.puzzleHandler.handleCorrectStoneDrop(
          feedbackIndex,
          this.feedbackTextEffects,
          (idx) => this.getRandomFeedBackText(idx),
          () => this.score += 100
        ),
        handleStoneDropEnd: this.handleStoneDropEnd.bind(this),
        triggerMonsterAnimation: this.triggerMonsterAnimation.bind(this),
        timerTicking: this.timerTicking,
        isFeedBackTriggeredSetter: (v) => { this.isFeedBackTriggered = v; },
        lang,
        stonesCountRef,
        feedBackTexts: this.feedBackTexts,
        levelData: this.levelData,
        counter: this.counter,
        width: this.width
      });
      this.stonesCount = stonesCountRef.value;
      this.isFeedBackTriggered = true;
      this.pickedStone = null;
    } else {
      if (
        this.pickedStone &&
        this.pickedStoneObject
      ) {
        // Use stoneHandler's resetStonePosition method for consistency
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
    this.puzzleHandler.clearPickedUp();
  };


  // Event to identify mouse moved down on the canvas
  handleMouseDown = (event) => {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
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
      return; // Prevent dragging if the stone is animating
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
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }

    let trailX = event.clientX;
    let trailY = event.clientY

    if (this.pickedStone) {
      if (!this.puzzleHandler.checkIsWordPuzzle()) {
        const newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
          this.pickedStone,
          event.clientX,
          event.clientY
        );
        this.pickedStone = newStoneCoordinates;
        trailX = newStoneCoordinates.x;
        trailY = newStoneCoordinates.y;
      } else {
        const newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
          this.pickedStone,
          event.clientX,
          event.clientY
        );
        this.pickedStone = newStoneCoordinates;
        trailX = newStoneCoordinates.x;
        trailY = newStoneCoordinates.y;

        if (this.puzzleHandler.checkIsWordPuzzle()) {
          const newStoneLetter = this.stoneHandler.handleHoveringToAnotherStone(
            trailX,
            trailY,
            (foilStoneText, foilStoneIndex) => {
              return this.puzzleHandler.handleCheckHoveredStone(foilStoneText, foilStoneIndex);
            }
          );

          if (newStoneLetter) {
            this.puzzleHandler.setPickUpLetter(
              newStoneLetter?.text,
              newStoneLetter?.foilStoneIndex
            );

            this.pickedStone = this.stoneHandler.resetStonePosition(
              this.width,
              this.pickedStone,
              this.pickedStoneObject
            );

            //After resetting its original position replace it with the new letter.
            this.pickedStoneObject = newStoneLetter;
            this.pickedStone = newStoneLetter;
          }
        }
      }
      // Trigger open mouth animation
      this.triggerMonsterAnimation('isMouthOpen');
    }
  };


  handleMouseClick = (event) => {
    let rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.monster.onClick(x, y)) {
      this.isGameStarted = true;
      this.time = 0;
      this.tutorial.setGameHasStarted();
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
  };


  handleTouchMove = (event) => {
    const touch = event.touches[0];
    this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };


  handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
  };


  draw(deltaTime: number) {
    if (!this.isGameStarted && !this.isPauseButtonClicked) {
      this.time = this.time + deltaTime;
      if (this.time >= 5000) {
        this.isGameStarted = true;
        this.time = 0;
        this.tutorial.setGameHasStarted();
      }
    }
    // The promptText.draw method has been removed as it's now handled by HTML/CSS
    this.trailEffectHandler?.draw();
    if (this.isPauseButtonClicked && this.isGameStarted) {
      this.handleStoneLetterDrawing(deltaTime);
    }

    if (!this.isPauseButtonClicked && this.isGameStarted) {
      this.handleStoneLetterDrawing(deltaTime);
    }

    if (!this.isPauseButtonClicked && this.counter == 0) {
      this.tutorial.drawLetterPuzzleTutorial(deltaTime);
    }
  }


  private handleStoneLetterDrawing(deltaTime) {
    if (this.puzzleHandler.checkIsWordPuzzle()) {
      const { groupedObj } = this.puzzleHandler.getWordPuzzleValues();
      this.stoneHandler.drawWordPuzzleLetters(
        deltaTime,
        (foilStoneIndex) => {
          return this.puzzleHandler.validateShouldHideLetter(foilStoneIndex);
        },
        groupedObj
      );
    } else {
      this.stoneHandler.draw(deltaTime);
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
      this.tutorial.setGameHasEndedFlag(); // Turn off tutorial
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
    // Ensure puzzleHandler is set up for new puzzle
    this.puzzleHandler.initialize(this.levelData, this.counter);
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


  private checkStoneDropped(stone, feedBackIndex, isWord = false) {
    // Return the result of the drop handler logic
    return this.stoneHandler.isStoneLetterDropCorrect(stone, feedBackIndex, isWord);
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


  private dispatchStoneDropEvent(isCorrect: boolean): void {
    const dropStoneEvent = new CustomEvent(STONEDROP, {
      detail: { isCorrect: isCorrect },
    });

    document.dispatchEvent(dropStoneEvent);
  }


  public logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string) {
    let endTime = Date.now();
    const { droppedLetters } = this.puzzleHandler.getWordPuzzleValues();
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