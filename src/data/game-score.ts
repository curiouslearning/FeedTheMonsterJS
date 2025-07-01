import { Debugger, lang } from "@common";

export class GameScore {
  public static currentlanguage: string = lang;

  public static setGameLevelScore(currentLevelInfo, score) {
    let starsGained = this.calculateStarCount(score);
    let levelPlayedInfo = {
      levelName: currentLevelInfo.levelMeta.levelType,
      levelNumber: currentLevelInfo.levelMeta.levelNumber,
      score: score,
      starCount: starsGained,
    };
    let allGameLevelInfo = this.getAllGameLevelInfo();
    let index = allGameLevelInfo.findIndex(
      (level) => level.levelNumber === levelPlayedInfo.levelNumber
    );

    if (index !== -1) {
      // Update only if the new score is higher
      if (levelPlayedInfo.score > allGameLevelInfo[index].score) {
        allGameLevelInfo[index] = levelPlayedInfo;
      }
    } else {
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
      // Only count levels with 2 or more stars toward the total
      (sum, level) => sum + (level.starCount >= 2 ? level.starCount : 0),
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
