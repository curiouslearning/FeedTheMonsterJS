import { lang } from "../../../global-variables";

export class GameScore {
  public static currentlanguage: string = lang;

  public static setGameLevelScore(currentLevelInfo, score) {
    let levelPlayedInfo = {
      levelName: currentLevelInfo.levelMeta.levelType,
      levelNumber: currentLevelInfo.levelMeta.levelNumber,
      score: score,
      starCount: this.calculateStarCount(score),
    };
    let allGamelevelInfo: any[] = this.getAllGameLevelInfo();
    allGamelevelInfo.push(levelPlayedInfo);
    localStorage.setItem("gamePlayedInfo", JSON.stringify(allGamelevelInfo));
  }

  public static getAllGameLevelInfo(): any[] {
    const data = localStorage.getItem(this.currentlanguage + "gamePlayedInfo");
    return data == undefined ? [] : JSON.parse(data);
  }
  
  public static calculateStarCount(score: number): number {
    return score == 200
      ? 1
      : score == 300
      ? 2
      : score == 400
      ? 2
      : score == 500
      ? 3
      : 0;
  }
}
