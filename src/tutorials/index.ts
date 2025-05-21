import QuickStartTutorial from './QuickStartTutorial/QuickStartTutorial';
import MatchLetterPuzzleTutorial from './MatchLetterPuzzleTutorial/MatchLetterPuzzleTutorial';
import gameStateService from '@gameStateService';

type TutorialInitParams = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  puzzleLevel ?: number;
  shouldHaveTutorial?: boolean;
};
export default class TutorialHandler {
  private width: number;
  private height: number;
  private context: CanvasRenderingContext2D;
  private puzzleLevel: number;
  private activeTutorial: null | MatchLetterPuzzleTutorial;
  private quickTutorial: null | QuickStartTutorial;
  private hasGameEnded: boolean = false;
  private isGameOnPause: boolean = false;
  public gameTypesList: {} | {
    LetterInWord: number;
    LetterOnly: number;
    SoundLetterOnly: number;
    Word: number;
  };
  private hasEstablishedSubscriptions: boolean = false; //Flag if there are subscription to events established.
  private unsubscribeStoneCreationEvent: () => void; //Listener for stone creation in stone handler.
  private unsubscribePauseEvent: () => void; //Listener for game pause event.

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
      this.puzzleLevel === 0 &&
      !this.hasEstablishedSubscriptions
    ) {
      this.hasEstablishedSubscriptions = true;
      this.gameTypesList = gameStateService.getGameTypeList();
      this.initializeTutorialValues({ context, width, height });

      this.unsubscribeStoneCreationEvent = gameStateService.subscribe(
        gameStateService.EVENTS.CORRECT_STONE_POSITION,
        (stoneDataImgAndPos: { stonePosVal: number[], img: any, levelData: any }) => {
          if (this.puzzleLevel === 0) {
            /*
            * stoneDataImgAndPos contains the stone details from stone handler.
            * It has the correct stone coordinates needed for the tutorial of dragging stones.
            */
            const { stonePosVal, img, levelData } = stoneDataImgAndPos;
            const { protoType, levelType } = levelData?.levelMeta;
            const levelNumber = levelData?.levelNumber;
            const gameLevel = typeof levelNumber === 'string'
              ? parseInt(levelNumber)
              : levelNumber;
            const gameTypeName = protoType === 'Hidden' ? `Sound${levelType}` : levelType

            this.activeTutorial = this.createTutorialInstance({ gameLevel, stonePosVal, img, gameTypeName });
          }
        }
      );

      this.unsubscribePauseEvent = gameStateService.subscribe(
        gameStateService.EVENTS.GAME_PAUSE_STATUS_EVENT,
        (isPause: boolean) => {
          this.isGameOnPause = isPause;
        }
      );
    }
  }

  private initializeTutorialValues({ context, width, height }: TutorialInitParams) {
    this.width = width;
    this.height = height;
    this.context = context;
    this.quickTutorial = new QuickStartTutorial({ context: this.context });
  }

  private createTutorialInstance({ gameLevel, stonePosVal, img, gameTypeName }: {
    gameLevel: number,
    stonePosVal: number[],
    img: any,
    gameTypeName: string,
  }) {
    if (this.gameTypesList[gameTypeName] === gameLevel) {
      return new MatchLetterPuzzleTutorial({
        context: this.context,
        width: this.width,
        height: this.height,
        stoneImg: img,
        stonePosVal
      });
    }

    //Add more if conditions here for new tutorial instances.

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
      this.hasEstablishedSubscriptions = false;
    }
  }
}