import { Debugger, lang } from "@common";

export class GameScore {
  public static currentlanguage: string = lang;

  public static setGameLevelScore(currentLevelInfo, score, treasureChestMiniGameScore) {
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

      // Update only if the new score is higher either from mini game or actual game score.
      if (isNewScoreHigher || isNewMiniGameScoreHigher) {
        allGameLevelInfo[index] = levelPlayedInfo;
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
    return starCount == undefined ? 0: parseInt(starCount);
  }
  
  public static calculateStarCount(score: number): number {
    switch (score) {
      case 200:
        return 1;
      case 300:
      case 400:
        return 2;
      case 500:
        return 3;
      default:
        return 0;
    }
  }

  public static getDatafromStorage() {
    const key = Debugger.DebugMode ? "ProfileDebug" : "Profile";
    return JSON.parse(localStorage.getItem(lang + key) || "{}");
  }
}
