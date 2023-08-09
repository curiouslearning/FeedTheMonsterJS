export class DataModal {
  public title: string
  public otherAudios: OtherAudios;
  public levels: number;
  public FeedbackTexts: FeedbackTexts;
  public FeedbackAudios: FeedbackAudios;
  public rightToLeft: any;

  constructor(
    title: string,
    otherAudios: { [x: string]: any },
    levels: number,
    feedbackTexts: string,
    rightToLeft: any,
    feedbackAudios: any
  ) {
    this.title = title;
    this.otherAudios = new OtherAudios(otherAudios);
    this.levels = this.getLevels(levels);
    this.FeedbackTexts = new FeedbackTexts(feedbackTexts);
    this.FeedbackAudios = new FeedbackAudios(feedbackAudios);
    this.rightToLeft = rightToLeft;
  }

  getLevels(levels) {
    let levelArray: any = [];
    for (let i = 0; i < levels.length; i++) {
      levelArray.push(new Levels(levels[i]));
    }

    return levelArray;
  }
}

export class OtherAudios {
  public selctYourPlayer: any;
  public watchMeGrow: any;
  public areYouSure: any;

  constructor(otherAudios: any) {
    this.selctYourPlayer = otherAudios["Select your player"];
    this.watchMeGrow = otherAudios["Watch me grow"];
    this.areYouSure = otherAudios["Are you sure"];
  }
}

export class FeedbackTexts {
  public fantastic: any;
  public great: any;
  public amazing: any;

  constructor(feedbackTexts) {
    if(feedbackTexts.length>=1){
      this.fantastic = feedbackTexts[0];
    }
    if(feedbackTexts.length>=2){
       this.great = feedbackTexts[1];
      }
    if(feedbackTexts.length>=3){
      this.amazing = feedbackTexts[2];
    }
     
   
    
  }
}

export class FeedbackAudios {
  public fantastic: any;
  public great: any;
  public amazing: any;

  constructor(feedbackAudios) {
    if(feedbackAudios.length>=1){
      this.fantastic = feedbackAudios[0];
    }
    if(feedbackAudios.length>=2){
       this.great = feedbackAudios[1];
      }
    if(feedbackAudios.length>=3){
      this.amazing = feedbackAudios[2];
    }
  }
}

export class Levels {
  public puzzles: any;
  public levelMeta: any;
  public levelNumber: any;

  constructor(levels) {
    this.puzzles = this.getPuzzleData(levels);
    this.levelMeta = new LevelMeta(levels.LevelMeta);
    this.levelNumber = levels.LevelNumber;
  }
  getPuzzleData(levels) {
    let puzzleObjects: any = [];
    levels.Puzzles.map((puzzleData, index) => {
      puzzleObjects.push(new Puzzles(puzzleData));
    });
    return puzzleObjects;
  }

  // getAllPuzzle() {
  //     this.puzzleDataArray = []
  //     this.puzzles = []
  //     this.levelMeta = []
  //     this.levelNumber;
  //     this.levels.map((data, index)=> {
  //         data.Puzzles.map((pData, index) => {
  //             this.puzzles.push(new Puzzles(pData));
  //         })
  //         this.levelMeta.push(new LevelMeta(data.LevelMeta));
  //         this.puzzleDataArray.push(this.puzzles)
  //     });

  //     return this.puzzleDataArray;
  // }
}

export class Puzzles {
  public segmentNumber: any;
  public prompt: any;
  public foilStones: any;
  public targetStones: any;

  constructor(puzzle) {
    this.segmentNumber = puzzle.SegmentNumber;
    this.prompt = new Prompt(puzzle.prompt);
    this.foilStones = this.getFoilStones(puzzle);
    this.targetStones = this.getTargetStones(puzzle);
  }
  getFoilStones(puzzle) {
    let foilStoneArray: any = [];
    puzzle.foilstones.map((stones: { StoneText: any }, index: any) => {
      foilStoneArray.push(stones.StoneText);
    });
    return foilStoneArray;
  }

  getTargetStones(puzzle) {
    let targetStoneArray: any = [];
    puzzle.targetstones.map((stones, index) => {
      targetStoneArray.push(stones.StoneText);
    });
    return targetStoneArray;
  }
}

export class FoilStone {
  public stoneText: any;

  constructor(stoneText) {
    this.stoneText = stoneText;
  }
}

export class TargetStone {
  public stoneText: any;

  constructor() {
    this.stoneText;
  }
}

export class Prompt {
  public promptText: any;
  public promptAudio: any;

  constructor(prompt: { PromptText: any; PromptAudio: any }) {
    this.promptText = prompt.PromptText;
    this.promptAudio = prompt.PromptAudio;
  }
}

export class LevelMeta {
  public promptFadeOut: any;
  public letterGroup: any;
  public levelNumber: any;
  public protoType: any;
  public levelType: any;

  constructor(levelMeta) {
    this.promptFadeOut = levelMeta.PromptFadeout;
    this.letterGroup = levelMeta.LetterGroup;
    this.levelNumber = levelMeta.LevelNumber;
    this.protoType = levelMeta.PromptType;
    this.levelType = levelMeta.LevelType;
  }
}
