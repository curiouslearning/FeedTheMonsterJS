import QuickStartTutorial from './QuickStartTutorial/QuickStartTutorial';
import MatchLetterPuzzleTutorial from './MatchLetterPuzzleTutorial/MatchLetterPuzzleTutorial';
import WordPuzzleTutorial from './WordPuzzleTutorial/WordPuzzleTutorial';
import AudioPuzzleTutorial from './AudioPuzzleTutorial/AudioPuzzleTutorial';
import gameStateService from '@gameStateService';
import { getGameTypeName, isGameTypeAudio } from '@common';

type TutorialInitParams = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  puzzleLevel?: number;
  shouldHaveTutorial?: boolean;
};
export default class TutorialHandler {
  private quickStartTutorialTimerId: ReturnType<typeof setTimeout> | null = null;
  public quickStartTutorialReady: boolean = false;
  public shouldShowTutorialAnimation: boolean = false; // Set externally as needed
  private width: number;
  private height: number;
  private context: CanvasRenderingContext2D;
  private puzzleLevel: number;
  private shouldHaveTutorial: boolean;
  public activeTutorial: null | MatchLetterPuzzleTutorial | WordPuzzleTutorial | AudioPuzzleTutorial;
  private quickTutorial: null | QuickStartTutorial;
  private hasGameEnded: boolean = false;
  private isGameOnPause: boolean = false;
  public instantDropStone: boolean = false;
  public gameTypesList: {} | {
    LetterInWord: number;
    LetterOnly: number;
    SoundLetterOnly: number;
    Word: number;
  };
  private gameTypeName: string;
  private hasEstablishedSubscriptions: boolean = false; //Flag if there are subscription to events established.
  private unsubscribeStoneCreationEvent: () => void; //Listener for stone creation in stone handler.
  private unsubscribePauseEvent: () => void; //Listener for game pause event.
  private unsubscribeLevelEndData: () => void; //Listener to check if the game is about to switch to level-end.
  private tutorialElapsedTime: number = 0;
  private readonly tutorialHoldDuration: number = 12000; // 12 seconds
  private isWordPuzzle: boolean = false;

  constructor({ context, width, height, puzzleLevel, shouldHaveTutorial }: TutorialInitParams) {
    this.quickTutorial = null;
    this.activeTutorial = null;
    this.puzzleLevel = puzzleLevel;
    this.shouldHaveTutorial = shouldHaveTutorial;
    this.initializeSubscriptionsAndValues({ context, width, height });
  }

  private checkShouldHaveTutorial() {
    return this.shouldHaveTutorial &&
      this.puzzleLevel === 0 &&
      !this.hasEstablishedSubscriptions
  }

  private initializeSubscriptionsAndValues({ context, width, height }: TutorialInitParams) {
    //Create and initialize values only if tutorial should be created.
    if (
      this.checkShouldHaveTutorial()
    ) {
      this.hasEstablishedSubscriptions = true;
      this.gameTypesList = gameStateService.getGameTypeList();
      this.initializeTutorialValues({ context, width, height });

      this.unsubscribeStoneCreationEvent = gameStateService.subscribe(
        gameStateService.EVENTS.CORRECT_STONE_POSITION,
        (eventData: {
          stonePosVal: number[], //single stone position for non-word puzzles.
          allStonePosVal: number[][], //all stone positions.
          img: any,
          levelData: any
        }) => {
          this.isWordPuzzle = eventData.levelData?.levelMeta?.levelType === 'Word';

          // Get game type from level data
          const gameTypeName = getGameTypeName(
            eventData.levelData.levelMeta.protoType,
            eventData.levelData.levelMeta.levelType
          );
          this.gameTypeName = gameTypeName; // Store for later use

          // Get the game level
          const gameLevel = eventData.levelData.levelNumber;

          // Only create tutorial if the game type hasn't been cleared yet
          if (!this.gameTypesList[gameTypeName]?.isCleared) {
            //If this.isWordPuzzle is true, use the allStonePosVal; Otherwise use the stone poition value for non-word/spelling game types.
            const stonePosVal = this.isWordPuzzle ? eventData.allStonePosVal : eventData.stonePosVal

            this.activeTutorial = this.createTutorialInstance({
              gameLevel,
              stonePosVal,
              img: eventData.img,
              gameTypeName,
              levelData: eventData.levelData
            });
          }
        }
      );

      this.unsubscribePauseEvent = gameStateService.subscribe(
        gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
        (isPause: boolean) => {
          this.isGameOnPause = isPause;
        }
      );

      this.unsubscribeLevelEndData = gameStateService.subscribe(
        gameStateService.EVENTS.LEVEL_END_DATA_EVENT, (data) => {
          //Marked the tutorial as cleared so it won't show up again after clearing it.
          gameStateService.setClearedTutorial(this.gameTypeName);
        });
    }
  }

  /**
 * Handles all tutorial gating and quick start logic for a scene.
 * Call this from GameplayScene.draw for clean separation.
 * Mutates timeRef and calls setGameToStart when appropriate.
 */
  public handleTutorialAndGameStart({
    deltaTime,
    isGameStarted,
    isPauseButtonClicked,
    setGameToStart,
    timeRef
  }: {
    deltaTime: number,
    isGameStarted: boolean,
    isPauseButtonClicked: boolean,
    setGameToStart: () => void,
    timeRef: { value: number }
  }) {
    const shouldRunQuickStartTutorial = this.shouldShowTutorialAnimation && this.quickStartTutorialReady && this.puzzleLevel === 0;
    const shouldWaitForQuickStartTutorial = this.shouldShowTutorialAnimation && !this.quickStartTutorialReady && this.puzzleLevel === 0;
    // If game hasn't started and it's not paused
    if (!isGameStarted && !isPauseButtonClicked) {
      // Gate the tutorial animation behind both the tutorial flag and the timer-based flag
      if (shouldRunQuickStartTutorial) {
        // Draw the quick-start tutorial animation only after delay
        this.drawQuickStart(deltaTime, isGameStarted);
        // Start the game after the tutorial finishes
        if (this.isQuickStartFinished()) {
          setGameToStart();
        }
        return; // Wait until tutorial ends
      } else if (shouldWaitForQuickStartTutorial) {
        // Wait for the delay to expire before starting tutorial animation
        // Optionally, could show a loading indicator or do nothing
        return;
      } else {
        // No tutorial: immediately start the game on new puzzle
        timeRef.value += deltaTime;
        if (timeRef.value >= 5000) {
          setGameToStart();
        }
      }
    }
  }

  private initializeTutorialValues({ context, width, height }: TutorialInitParams) {
    this.width = width;
    this.height = height;
    this.context = context;
  }

  public updateTutorialTimer(deltaTime: number): boolean {
    if (this.quickTutorial && !this.isGameOnPause) {
      this.tutorialElapsedTime += deltaTime;
      return this.tutorialElapsedTime >= this.tutorialHoldDuration;
    }
    return true; // No tutorial active, allow timer update
  }

  public resetTutorialTimer(): void {
    this.tutorialElapsedTime = 0;
  }

  private createTutorialInstance({ gameLevel, stonePosVal, img, gameTypeName, levelData = null }: {
    gameLevel: number,
    stonePosVal: number[] | number[][],
    img: CanvasImageSource,
    gameTypeName: string,
    levelData?: any
  }) {
    // Create quick start tutorial
    this.quickTutorial = new QuickStartTutorial({ context: this.context });
    // Only create tutorial if this is the correct level for this game type
    if (this.gameTypesList[gameTypeName]?.levelNumber === gameLevel) {
      // For letter puzzles (single stone)
      if (gameTypeName === 'LetterOnly' || gameTypeName === 'LetterInWord') {
        return new MatchLetterPuzzleTutorial({
          context: this.context,
          width: this.width,
          height: this.height,
          stoneImg: img,
          stonePosVal: stonePosVal as number[]
        });
      }

      // for audio puzzles tutorial
      if (gameTypeName === 'SoundLetterOnly') {
        return new AudioPuzzleTutorial({
          context: this.context,
          width: this.width,
          height: this.height,
          stoneImg: img,
          stonePosVal: stonePosVal as number[]
        });
      }

      // For word puzzles (multiple stones in sequence)
      if (gameTypeName === 'Word') {
        return new WordPuzzleTutorial({
          context: this.context,
          width: this.width,
          height: this.height,
          stoneImg: img,
          stonePositions: stonePosVal as number[][],
          levelData: levelData
        });
      }

      //Add more if conditions here for new tutorial instances.
    }

    return null;
  }

  /*
   * hideTutorial - Use this method if we want to hide the tutorial during certain event or action.
  */
  public hideTutorial() {
    if (this.activeTutorial) {
      this.puzzleLevel++;
      //Dispose first any active tutorial's dispose method if there is any.
      this.activeTutorial?.dispose();
      this.activeTutorial = null;
      this.quickTutorial = null;
    }
  }

  drawQuickStart(deltaTime: number, hasGameStarted: boolean) {
    if (!hasGameStarted && this.quickTutorial) {
      const handPointer = document.getElementById('hand-pointer');
      if (handPointer) {
        handPointer.style.display = 'none';
      }
      if (!this.instantDropStone)
        //Show quick tip by pressing the center/near monster.
        this.quickTutorial.quickStartTutorial(deltaTime, this.width, this.height);
    }
  }

  public isQuickStartFinished(): boolean {
    if (this.instantDropStone) return true;
    return this.quickTutorial?.isFinished ?? false;
  }

  draw(deltaTime: number, hasGameStarted: boolean) {
    //Draw only if there is an active tutorial instance.
    if (this.activeTutorial && !this.isGameOnPause && hasGameStarted) {
      !this.hasGameEnded && this.activeTutorial?.drawTutorial(deltaTime);
    }
  }

  dispose() {
    //Clear canvas tutorials and reset values;
    if (this.hasEstablishedSubscriptions) {
      this.activeTutorial?.dispose();
      this.isGameOnPause = false;
      this.hasGameEnded = false;
      this.quickTutorial = null;
      this.activeTutorial = null;
      this.unsubscribeStoneCreationEvent();
      this.unsubscribePauseEvent();
      this.unsubscribeLevelEndData();
      this.hasEstablishedSubscriptions = false;
      this.isWordPuzzle = false;
    }
  }

  showHandPointerInAudioPuzzle(levelData: any) {
    const meta = levelData?.levelMeta;
    const gameTypesList = this.gameTypesList;
    const key = meta && getGameTypeName(meta.protoType, meta.levelType);

    if (
      !meta ||
      !gameTypesList ||
      key !== 'SoundLetterOnly'
    ) {
      return false;
    }

    const gameType = gameTypesList[key];
    if (!gameType) return false;

    return this.instantDropStone = !!(
      !gameType.isCleared &&
      gameType.levelNumber === meta.levelNumber
    );
  }

  /**
   * Starts or resets the 6-second timer that gates the quick start tutorial animation.
   * This should be called whenever the prompt is shown or a new puzzle is loaded.
   */
  public resetQuickStartTutorialDelay() {
    // Always clear any previous timer to avoid overlap
    if (this.quickStartTutorialTimerId !== null) {
      clearTimeout(this.quickStartTutorialTimerId);
      this.quickStartTutorialTimerId = null;
    }
    this.quickStartTutorialReady = false;
    // Only start the timer if the tutorial should be shown
    if (this.shouldShowTutorialAnimation) {
      this.quickStartTutorialTimerId = setTimeout(() => {
        this.quickStartTutorialReady = true;
      }, 6000); // 6 seconds
    }
  }

  /**
   * compute common prompt text context values for both layout and runtime logic.
   */
  public static getPromptTextContext(levelData: any, gameTypesList: any) {
    const isMatchSound = isGameTypeAudio(levelData?.levelMeta?.protoType);
    const gameTypeName = getGameTypeName(levelData?.levelMeta?.protoType, levelData?.levelMeta?.levelType);
    const gameType = gameTypesList?.[gameTypeName];
    return { isMatchSound, gameTypesList, gameTypeName, gameType };
  }
}