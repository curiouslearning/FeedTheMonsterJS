import { lang } from "../../../global-variables";

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
    this.setTotalStarCount(starsGained);
    let allGamelevelInfo: any[] = this.getAllGameLevelInfo();
    let index = -1;
    for (let i = 0; i < allGamelevelInfo.length; i++) {
      if (allGamelevelInfo[i].levelNumber === levelPlayedInfo.levelNumber) {
        index = i;
        break;
      }
    }
    if (index !== -1 && levelPlayedInfo.score > allGamelevelInfo[index].score) {
      allGamelevelInfo[index] = levelPlayedInfo;
    } else {
      allGamelevelInfo.push(levelPlayedInfo);
    }
    localStorage.setItem(this.currentlanguage + "gamePlayedInfo", JSON.stringify(allGamelevelInfo));
  }


  public static getAllGameLevelInfo(): Map<string, any>[] {
    const data = localStorage.getItem(this.currentlanguage + "gamePlayedInfo");
    return data == undefined ? [] : JSON.parse(data) as Map<string, any>[];
  }

  public static setTotalStarCount(starsGained){
    let starCount = this.getTotalStarCount();
    let totalStarCount = starCount + starsGained;
    localStorage.setItem(this.currentlanguage + "totalStarCount",totalStarCount);

  }

  public static getTotalStarCount(){
    const starCount = localStorage.getItem(this.currentlanguage + "totalStarCount");
    return starCount == undefined ? 0: parseInt(starCount);
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
