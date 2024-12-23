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
  PreviousPlayedLevel,
} from "@constants";
import { WordPuzzleLogic } from '@gamepuzzles';
import gameStateService from '@gameStateService';
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
  public monsterPhaseNumber: number;
  public pickedStone: StoneConfig;
  public puzzleStartTime: number;
  pausePopupComponent: PausePopupComponent
  public showTutorial: boolean;
  public feedBackTexts: any;
  public isPuzzleCompleted: boolean;
  public rightToLeft: boolean;
  public switchSceneToEnd: Function;
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
  public switchToLevelSelection: Function;
  public reloadScene: Function;
  private data: DataModal;
  public triggerInputs: any;
  audioPlayer: AudioPlayer;
  firebaseIntegration: FirebaseIntegration;
  startTime: number;
  puzzleTime: number;
  isDisposing: boolean;
  trailParticles: any;
  wordPuzzleLogic: any;
  public riveMonsterElement: HTMLCanvasElement;
  public gameControl: HTMLCanvasElement;
  private unsubscribeEvent: () => void;
  public timeTicker: HTMLElement;
  isFeedBackTriggered: boolean;
  constructor({
    monsterPhaseNumber,
    switchSceneToEnd,
    switchToLevelSelection,
    reloadScene
  }) {
    const gamePlayData = gameStateService.getGamePlaySceneDetails();
    this.pausePopupComponent = new PausePopupComponent();
    // Assign state properties based on game state
    this.initializeProperties(gamePlayData);
    // UI element setup
    this.setupUIElements();
    this.monsterPhaseNumber = monsterPhaseNumber || 1;
    this.switchSceneToEnd = switchSceneToEnd;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;
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
    this.wordPuzzleLogic = new WordPuzzleLogic(this.levelData, this.counter);
    this.unsubscribeEvent = gameStateService.subscribe(
      gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
      (isPause: boolean) => {
        this.isPauseButtonClicked = isPause;

        if (isPause) this.pausePopupComponent.open();
      }
    );

    this.pausePopupComponent.onClose((event) => {
      const { data } = event;

      switch (data) {
        case PAUSE_POPUP_EVENT_DATA.RESTART_LEVEL:
          gameStateService.publish(gameStateService.EVENTS.GAMEPLAY_DATA_EVENT, {
            currentLevelData: this.levelData,
            selectedLevelNumber: this.levelNumber,
          });
          gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true)
          this.reloadScene('GamePlay');
          break;
        case PAUSE_POPUP_EVENT_DATA.SELECT_LEVEL:
          gameStateService.publish(gameStateService.EVENTS.SCENE_LOADING_EVENT, true);
          gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
          this.switchToLevelSelection('GamePlay');
        default:
          gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, false);
          this.resumeGame();
      }
    });

    this.setupBg();
  }

  private initializeRiveMonster(initialAnimation: string = RiveMonsterComponent.Animations.IDLE): RiveMonsterComponent {
    return new RiveMonsterComponent({
      canvas: this.riveMonsterElement,
      autoplay: true,
      fit: "contain",
      alignment: "topCenter",
      onLoad: () => {
        this.monster.play(initialAnimation);
      },
      gameCanvas: this.canvas
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
    this.handler = document.getElementById("canvas");
    this.riveMonsterElement = document.getElementById("rivecanvas") as HTMLCanvasElement;
    this.riveMonsterElement.style.zIndex = "4";
    this.gameControl = document.getElementById("game-control") as HTMLCanvasElement;
    this.gameControl.style.zIndex = "5";
  }

  private initializeProperties(gamePlayData) {
    this.isPauseButtonClicked = gamePlayData?.isGamePaused;
    this.width = gamePlayData.width;
    this.height = gamePlayData.height;
    this.rightToLeft = gamePlayData.rightToLeft;
    this.canvas = gamePlayData.canvas
    this.context = gamePlayData.gameCanvasContext;
    this.levelData = gamePlayData.levelData;
    this.levelNumber = gamePlayData.levelNumber;
    this.jsonVersionNumber = gamePlayData.jsonVersionNumber;
    this.feedBackTexts = gamePlayData.feedBackTexts;
    this.data = gamePlayData.data;
  }

  setupBg = () => {
    // Determine the background type based on the level number using the static method
    const selectedBackgroundType = BackgroundHtmlGenerator.createBackgroundComponent(this.levelData.levelMeta.levelNumber);

    // Apply the logic to update the HTML or visual representation of the background
    const backgroundGenerator = new BackgroundHtmlGenerator();

    // Dynamically update the background based on the selected type
    backgroundGenerator.generateBackground(selectedBackgroundType);
  };

  resumeGame = () => {
    this.addEventListeners();
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
      /*
        Note: TO DO: Should use stone-handler.ts method resetStonePosition.
      */

      if (
        this.pickedStone &&
        this.pickedStoneObject &&
        this.pickedStone.text &&
        typeof this.pickedStoneObject.origx === "number" &&
        typeof this.pickedStoneObject.origy === "number"
      ) {
        //Resets stones to original position after dragging.
        this.pickedStone.x = this.pickedStoneObject.origx;
        this.pickedStone.y = this.pickedStoneObject.origy;
        const triggerInputs = this.monster.getInputs();

        // Fetch relevant triggers
        const isMouthClosed = triggerInputs.find(input => input.name === 'isMouthClosed');
        const backToIdle = triggerInputs.find(input => input.name === 'backToIdle');

        /* TO DO: Add mouth close animation here. */
        isMouthClosed.fire();
        setTimeout(() => {
          backToIdle.fire();
        }, 1300);
      }

    }
    this.pickedStone = null;
    this.wordPuzzleLogic.clearPickedUp();
    gameStateService.publish(
      gameStateService.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT,
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

    if (!this.wordPuzzleLogic.checkIsWordPuzzle()) {
      /*To Do: Move all logic relating to stone handling including updating its coordnates to stone-handler.ts
        Note: Will have to eventually remove this and use the handlePickStoneUp in stone-handler.ts
        Will leave this for now to avoid affecting Letter Only puzzles with Word play puzzles implementation of multi-letter feature.
      */
      for (let sc of this.stoneHandler.foilStones) {
        const distance = Math.sqrt((x - sc.x) ** 2 + (y - sc.y) ** 2);
        if (distance <= 40) {
          this.pickedStoneObject = sc;
          this.pickedStone = sc;
          this.stoneHandler.playDragAudioIfNecessary(sc);

          /* TO DO: Add the open mouth animation trigger here. */

          break;
        }
      }
    } else {
      this.setPickedUp(x, y);
    }

    gameStateService.publish(gameStateService.EVENTS.GAME_TRAIL_EFFECT_TOGGLE_EVENT, true);
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
        this.wordPuzzleLogic.setPickUpLetter(
          stoneLetter?.text,
          stoneLetter?.foilStoneIndex
        );
      }
    }
  }

  handleMouseMove = (event) => {
    const triggerInputs = this.monster.getInputs();
    const isMouthOpened = triggerInputs.find(input => input.name === 'isMouthOpen'); //drag
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }

    let trailX = event.clientX;
    let trailY = event.clientY

    if (this.pickedStone) {
      if (!this.wordPuzzleLogic.checkIsWordPuzzle()) {
        /*To Do: Move all logic relating to stone handling including updating its coordnates to stone-handler.ts
         Note: Will have to eventually remove this and use the handleMovingStoneLetter in stone-handler.ts
         Will leave this for now to avoid affecting Letter Only puzzles with Word play puzzles implementation of multi-letter feature.
       */
        let rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // Simulate  open the mouth
        isMouthOpened.fire();
        this.pickedStone.x = x;
        this.pickedStone.y = y;
        trailX = x;
        trailY = y;
      } else {
        const newStoneCoordinates = this.stoneHandler.handleMovingStoneLetter(
          this.pickedStone,
          event.clientX,
          event.clientY
        );
        this.pickedStone = newStoneCoordinates;
        trailX = newStoneCoordinates.x;
        trailY = newStoneCoordinates.y;

        if (this.wordPuzzleLogic.checkIsWordPuzzle()) {
          const newStoneLetter = this.stoneHandler.handleHoveringToAnotherStone(
            trailX,
            trailY,
            (foilStoneText, foilStoneIndex) => {
              return this.wordPuzzleLogic.handleCheckHoveredStone(foilStoneText, foilStoneIndex);
            }
          );

          if (newStoneLetter) {
            this.wordPuzzleLogic.setPickUpLetter(
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

      this.monster.play(RiveMonsterComponent.Animations.MOUTHOPEN);
    }
    this.trailParticles?.addTrailParticlesOnMove(
      trailX,
      trailY
    );
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

    if (this.promptText.onClick(x, y)) {
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
    this.promptText.draw(deltaTime);
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
    if (this.wordPuzzleLogic.checkIsWordPuzzle()) {
      const { groupedObj } = this.wordPuzzleLogic.getValues();
      this.stoneHandler.drawWordPuzzleLetters(
        deltaTime,
        (foilStoneIndex) => {
          return this.wordPuzzleLogic.validateShouldHideLetter(foilStoneIndex);
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
        this.switchSceneToEnd();
      };

      if (timerEnded) {
        handleLevelEnd();
        return;
      }

      const timeoutId = setTimeout(handleLevelEnd, 4500); // added delay for switching to level end screen
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
        timerEnded ? 0 : 4500 // added delay for switching to level end screen
      );
    }
  };

  public dispose = () => {
    // Ensure TimerTicking is disposed of properly
    if (this.timerTicking) {
      this.timerTicking.destroy();
      this.timerTicking = null;
    }
    this.trailParticles.clearTrailSubscription();
    this.unsubscribeEvent();
    this.isDisposing = true;
    this.audioPlayer.stopAllAudios();
    this.monster.dispose();
    this.levelIndicators.dispose();
    this.stoneHandler.dispose();
    this.promptText.dispose();
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange,
      false
    );
    this.removeEventListeners();
    this.pausePopupComponent.destroy();
    this.pauseButton.dispose();
  };

  private checkStoneDropped(stone, feedBackIndex, isWord = false) {
    // Return the result of the drop handler logic
    return this.stoneHandler.isStoneLetterDropCorrect(stone, feedBackIndex, isWord);
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

    if (isCorrect) {
      this.handleCorrectStoneDrop(feedBackIndex);
    }

    this.isFeedBackTriggered = true;

    this.handleStoneDropEnd(isCorrect);
  }

  public wordPuzzle(droppedStoneInstance: StoneConfig) {
    const triggerInputs = this.monster.getInputs();
    // Fetch relevant triggers
    const isHappy = triggerInputs.find(input => input.name === 'isHappy');

    if (!isHappy) {
      console.error("Missing triggers for animations.");
      return false;
    }
    if (droppedStoneInstance.frame <= 99) {
      return; // Prevent dragging if the stone is animating
    }
    this.audioPlayer.stopFeedbackAudio();
    droppedStoneInstance.x = -999;
    droppedStoneInstance.y = -999;
    const feedBackIndex = this.getRandomInt(0, 1);
    this.wordPuzzleLogic.setGroupToDropped();
    const { droppedLetters } = this.wordPuzzleLogic.getValues();
    const isCorrect = this.wordPuzzleLogic.validateFedLetters();

    this.stoneHandler.processLetterDropFeedbackAudio(
      feedBackIndex,
      isCorrect,
      true,
      droppedLetters
    );

    if (isCorrect) {
      if (this.wordPuzzleLogic.validateWordPuzzle()) {
        this.handleCorrectStoneDrop(feedBackIndex);
        this.handleStoneDropEnd(isCorrect, "Word");
        this.stonesCount = 1;
        return;
      }

      this.timerTicking.startTimer();
      // Trigger animations via fire
      setTimeout(() => {
        isHappy.fire();
        console.log("Happy animation Triggered");
      }, 3000);
      this.promptText.droppedStoneIndex(
        lang == "arabic"
          ? this.stonesCount
          : droppedLetters.length
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
      // setTimeout(() => {
      isChewing.fire();
      console.log('triggered chew');
      // }, 350);
      setTimeout(() => {
        isHappy.fire();
        console.log("Happy animation Triggered");
      }, 1800);

    } else {
      // setTimeout(() => {
      isSpit.fire();
      console.log("Spit animation Triggered");
      // }, 1000);

      setTimeout(() => {
        isSad.fire();
        console.log("Sad animation Triggered");
      }, 1030);
    }

    this.logPuzzleEndFirebaseEvent(isCorrect, puzzleType);
    this.dispatchStoneDropEvent(isCorrect);
    this.loadPuzzle();
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

  private initNewPuzzle(loadPuzzleEvent) {
    this.monster.play(RiveMonsterComponent.Animations.IDLE); //TO DO: TO BE REMOVED.
    this.monster = this.initializeRiveMonster();
    this.removeEventListeners();
    this.isGameStarted = false;
    this.time = 0;
    this.wordPuzzleLogic.updatePuzzleLevel(loadPuzzleEvent?.detail?.counter);
    this.pickedStone = null;
    document.dispatchEvent(loadPuzzleEvent);
    this.addEventListeners();
    this.audioPlayer.stopAllAudios();
    this.startPuzzleTime();
  }

  public logPuzzleEndFirebaseEvent(isCorrect: boolean, puzzleType?: string) {
    let endTime = Date.now();
    const { droppedLetters } = this.wordPuzzleLogic.getValues();
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
  };

  handleVisibilityChange = () => {
    this.audioPlayer.stopAllAudios();
    gameStateService.publish(gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT, true);
    this.pauseGamePlay();
  };
}