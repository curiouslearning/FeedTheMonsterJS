import { Debugger, lang } from "@common";

// === Types ===
interface Prompt {
  promptText: string;
  promptAudio: string;
}
interface Puzzle {
  segmentNumber: number;
  prompt: Prompt;
  foilStones: string[];
  targetStones: string[];
}

interface LevelMeta {
  promptFadeOut: number;
  letterGroup: number;
  levelNumber: number;
  protoType: string;
  levelType: string;
}

interface CurrentLevelInfo {
  puzzles: Puzzle[];
  levelMeta: LevelMeta;
  levelNumber: number;
}

export class GameScore {
  public static currentlanguage: string = lang;
  public static setGameLevelScore(
    currentLevelInfo: CurrentLevelInfo,
    score: number,
    treasureChestMiniGameScore: number
  ): void {
    let starsGained = this.calculateStarCount(score);
    let levelPlayedInfo = {
      levelName: currentLevelInfo.levelMeta.levelType,
      levelNumber: currentLevelInfo.levelMeta.levelNumber,
      score: score,
      starCount: starsGained,
      treasureChestMiniGameScore,
    };
    let allGameLevelInfo = this.getAllGameLevelInfo();
    let index = allGameLevelInfo.findIndex(
      (level) => level.levelNumber === levelPlayedInfo.levelNumber
    );

    //If there are data found in local storage, cross check the scores.
    if (index !== -1) {
      //Check if the new scores are higher.
      const isNewScoreHigher = score > allGameLevelInfo[index].score;
      const isNewMiniGameScoreHigher = treasureChestMiniGameScore > allGameLevelInfo[index].treasureChestMiniGameScore;

      //If new game score is higher.
      if (isNewScoreHigher) {
        if (!isNewMiniGameScoreHigher) {
          //Update if ONLY NEW SCORE IS HiGHER and mini game score is the same.
          const savedMiniGameScore = allGameLevelInfo[index].treasureChestMiniGameScore;
          //Used the saved value of mini game score.
          levelPlayedInfo.treasureChestMiniGameScore = savedMiniGameScore;
        }
        // Save the updated score with the preserved mini game score.
        allGameLevelInfo[index] = levelPlayedInfo;
      } else if (!isNewScoreHigher && isNewMiniGameScoreHigher) {
        //If new game score IS NOT higher and ONLY the MINI GAME SCORE is higher.
        //Update only the treasureChestMiniGameScore value.
        allGameLevelInfo[index].treasureChestMiniGameScore = treasureChestMiniGameScore;
      }
    } else {
      // If the game level is newly cleared.
      allGameLevelInfo.push(levelPlayedInfo);
    }

    localStorage.setItem(
      this.currentlanguage + "gamePlayedInfo",
      JSON.stringify(allGameLevelInfo)
    );

    // Update total star count dynamically
    this.updateTotalStarCount();
  }

  public static getAllGameLevelInfo(): any[] {
    const data = localStorage.getItem(this.currentlanguage + "gamePlayedInfo");
    return data ? JSON.parse(data) : [];
  }

  private static updateTotalStarCount(): void {
    const allGameLevelInfo = this.getAllGameLevelInfo();
    const totalStarCount = allGameLevelInfo.reduce(
      (sum, level) => sum + level.starCount,
      0
    );
    localStorage.setItem(this.currentlanguage + "totalStarCount", totalStarCount.toString());
  }

  public static getTotalStarCount(): number {
    const starCount = localStorage.getItem(this.currentlanguage + "totalStarCount");
    return starCount == undefined ? 0 : parseInt(starCount);
  }

  public static calculateStarCount(score: number): number {
    switch (true) {
      case score >= 500: return 5;
      case score >= 400: return 4;
      case score >= 300: return 3;
      case score >= 200: return 2;
      case score >= 100: return 1;
      default: return 0;
    }
  }

  public static getDatafromStorage() {
    const key = Debugger.DebugMode ? "ProfileDebug" : "Profile";
    return JSON.parse(localStorage.getItem(lang + key) || "{}");
  }
}
