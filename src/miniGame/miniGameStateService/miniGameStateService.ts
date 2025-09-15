import { PubSub } from '../../events/pub-sub-events';
import { GameScore } from "@data";

type MiniGameMap = {
  [key: number]: { isMiniGameComplete: boolean };
};
export class MiniGameStateService extends PubSub {
  public EVENTS: {
    IS_MINI_GAME_DONE: string;
  }

  private treasureChestCompletedLevel: MiniGameMap;

  constructor() {
    super();
    this.EVENTS = {
      IS_MINI_GAME_DONE: 'IS_MINI_GAME_DONE'
    };
    //Add states here needed for mini games
    this.treasureChestCompletedLevel = {};
    this.initListeners();
    this.initMiniGameLevelList();
  }

  private initListeners() {
    /* Listeners to update mini game state values or trigger certain logics. */
    this.subscribe(this.EVENTS.IS_MINI_GAME_DONE, ({ miniGameScore, gameLevel }: {
      miniGameScore: number,
      gameLevel: number,
    }) => {
      //Plus one to match the expected level as game level starts at 0 whereas business logic starts at 1.
      const adjustGameLevelValue = gameLevel + 1;
      //Update treasure chest completed level list; Set to 'true for completion if star score is 1.
      this.treasureChestCompletedLevel[adjustGameLevelValue].isMiniGameComplete = miniGameScore === 1;
    });
  }

  //Creates levels of completed list of treasure chest minigame.
  private initMiniGameLevelList() {
    const completedLevel: MiniGameMap = {
      2: { isMiniGameComplete: false }, //starting level for mini game as per FM-594; not a special level.
    }
    let startingSpecialLevel = 5;

    while (startingSpecialLevel < 200) {
      completedLevel[startingSpecialLevel] = { isMiniGameComplete: false }; //Set false by default
      startingSpecialLevel += 10;
    }

    //Get saved game level information from local storage.
    const gameLevelsInfo = GameScore.getAllGameLevelInfo();

    //If there are saved data found, update the completedLevel to reflect the data saved form local storage.
    if (gameLevelsInfo.length) {
      //Update values of each levels in completedLevel based on what is saved in local storage.
      //A separate array is required as GameScore array doesn save in sequence things in sequences so inaccurate to relay on index.
      gameLevelsInfo.forEach((gameLevelResult: {
        levelName: string;
        levelNumber: number;
        score: number;
        starCount: number;
        treasureChestMiniGameScore: number;
      }) => {
        const levelNumber = gameLevelResult.levelNumber + 1;
        //If treasureChestMiniGameScore is one, level is complete with mini game treasure chest.
        if (completedLevel[levelNumber]) {
          completedLevel[levelNumber] = {
            isMiniGameComplete: gameLevelResult?.treasureChestMiniGameScore === 1 // 1 is the expected star count for a completed treasure chest mini game.
          };
        }
      });
    }
    //Assigned the completed level list to state treasureChestCompletedLevel.
    this.treasureChestCompletedLevel = completedLevel;
  }

  private selectLevelAtRandom(levelSegmentLength: number) {
    return Math.floor(Math.random() * levelSegmentLength) + 1;
  }

  public shouldShowMiniGame({
    gameLevel, levelSegmentLength
  }: {
    gameLevel: number, levelSegmentLength: number
  }) {
    //Plus one to match the expected level as game level starts at 0 whereas business logic starts at 1.
    const adjustGameLevelValue = gameLevel + 1;

    //Check if game level is completed or if the game level on the treasue chest list.
    const treasureChestMiniGameLevel = this.treasureChestCompletedLevel[adjustGameLevelValue];

    return treasureChestMiniGameLevel && !treasureChestMiniGameLevel?.isMiniGameComplete
      ? this.selectLevelAtRandom(levelSegmentLength)
      : 0; //Returns 0 to not show any treasure chest minigame.
  }

}
