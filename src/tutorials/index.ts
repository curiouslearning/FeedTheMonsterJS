import QuickStartTutorial from './QuickStartTutorial/QuickStartTutorial';
import MatchLetterPuzzleTutorial from './MatchLetterPuzzleTutorial/MatchLetterPuzzleTutorial';
import WordPuzzleTutorial from './WordPuzzleTutorial/WordPuzzleTutorial';
import gameStateService from '@gameStateService';
import { getGameTypeName } from '@common';

type TutorialInitParams = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  puzzleLevel?: number;
  shouldHaveTutorial?: boolean;
};
export default class TutorialHandler {
  private width: number;
  private height: number;
  private context: CanvasRenderingContext2D;
  private puzzleLevel: number;
  private activeTutorial: null | MatchLetterPuzzleTutorial | WordPuzzleTutorial;
  private quickTutorial: null | QuickStartTutorial;
  private hasGameEnded: boolean = false;
  private isGameOnPause: boolean = false;
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

  constructor({ context, width, height, puzzleLevel, shouldHaveTutorial }: TutorialInitParams) {
    this.quickTutorial = null;
    this.activeTutorial = null;
    this.puzzleLevel = puzzleLevel;
    this.initializeSubscriptionsAndValues({ shouldHaveTutorial, context, width, height });
  }

  private initializeSubscriptionsAndValues({ shouldHaveTutorial, context, width, height }: TutorialInitParams) {
    //Create and initialize values only if tutorial should be created.
    if (
      shouldHaveTutorial &&
      !this.hasEstablishedSubscriptions
    ) {
      this.hasEstablishedSubscriptions = true;
      this.gameTypesList = gameStateService.getGameTypeList();
      this.initializeTutorialValues({ context, width, height });

      this.unsubscribeStoneCreationEvent = gameStateService.subscribe(
        gameStateService.EVENTS.CORRECT_STONE_POSITION,
        (eventData: { 
          stonePosVal: number[] | number[][], 
          img: any, 
          levelData: any, 
          targetStones?: string[] 
        }) => {
          // Only process if we have valid data
          if (eventData.stonePosVal && eventData.img && eventData.levelData) {
            const gameTypeName = getGameTypeName(
              eventData.levelData.levelMeta.protoType, 
              eventData.levelData.levelMeta.levelType
            );
            this.gameTypeName = gameTypeName; // Store for later use
            
            // Only create tutorial for the first occurrence of each game type
            const gameLevel = eventData.levelData.levelNumber;
            const isFirstOccurrence = this.gameTypesList[gameTypeName]?.levelNumber === gameLevel;
            
            if (isFirstOccurrence && !this.gameTypesList[gameTypeName]?.isCleared) {
              this.activeTutorial = this.createTutorialInstance({
                gameLevel,
                stonePosVal: eventData.stonePosVal,
                img: eventData.img,
                gameTypeName,
                targetStones: eventData.targetStones || []
              });
            }
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

  private initializeTutorialValues({ context, width, height }: TutorialInitParams) {
    this.width = width;
    this.height = height;
    this.context = context;
  }

  private createTutorialInstance({ gameLevel, stonePosVal, img, gameTypeName, targetStones = [] }: {
    gameLevel: number,
    stonePosVal: number[] | number[][],
    img: CanvasImageSource,
    gameTypeName: string,
    targetStones?: string[]
  }) {
    if (!this.gameTypesList[gameTypeName]?.isCleared) {
      //Create quick start tutorial.
      this.quickTutorial = new QuickStartTutorial({ context: this.context });

      if (this.gameTypesList[gameTypeName]?.levelNumber === gameLevel) {
        // For letter puzzles (single stone)
        if (gameTypeName === 'LetterOnly' || gameTypeName === 'LetterInWord' || gameTypeName === 'SoundLetterOnly') {
          return new MatchLetterPuzzleTutorial({
            context: this.context,
            width: this.width,
            height: this.height,
            stoneImg: img,
            stonePosVal: stonePosVal as number[]
          });
        }
        
        // For word puzzles (multiple stones in sequence)
        // Only show tutorial for the first word puzzle level
        const isFirstWordPuzzle = this.gameTypesList[gameTypeName]?.levelNumber === gameLevel;
        if (gameTypeName === 'Word' && isFirstWordPuzzle) {
          return new WordPuzzleTutorial({
            context: this.context,
            width: this.width,
            height: this.height,
            stoneImg: img,
            stonePositions: stonePosVal as number[][],
            targetStones: Array.isArray(targetStones) ? targetStones : []
          });
        }
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
      this.activeTutorial = null;
      this.quickTutorial = null;
    }
  }

  drawQuickStart(deltaTime: number, hasGameStarted: boolean) {
    if (!hasGameStarted && this.quickTutorial) {
      //Show quick tip by pressing the center/near monster.
      this.quickTutorial.quickStartTutorial(deltaTime, this.width, this.height);
    }
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
      this.isGameOnPause = false;
      this.hasGameEnded = false;
      this.quickTutorial = null;
      this.activeTutorial = null;
      this.unsubscribeStoneCreationEvent();
      this.unsubscribePauseEvent();
      this.unsubscribeLevelEndData();
      this.hasEstablishedSubscriptions = false;
    }
  }
}