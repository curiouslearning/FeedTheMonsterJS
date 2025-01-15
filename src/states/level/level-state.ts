
export class LevelState {
  static instance: LevelState = undefined;
  private levels: any[];
  private currentLevel: any;
  constructor(
    private gameData: any
  ) {
    if (LevelState.instance) return LevelState.instance;
    LevelState.instance = this;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  setLevel(levelNumber: number) {
    this.currentLevel = {
      ...this.levels[levelNumber],
      levelNumber,
    };

    return {
      currentLevelData: this.currentLevel,
      selectedLevelNumber: levelNumber,
    };
  }
}
