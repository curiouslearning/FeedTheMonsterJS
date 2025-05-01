import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';

/**
 * Context object for creating a puzzle/handling a stone drop.
 */
interface CreatePuzzleContext {
  levelType: string;
  pickedStone: any;
  stoneHandler: any;
  audioPlayer: any;
  promptText: any;
  feedBackTexts: Record<string, string>;
  handleCorrectStoneDrop: (feedbackIndex: number) => void;
  handleStoneDropEnd: (isCorrect: boolean, type: string) => void;
  triggerMonsterAnimation: (name: string) => void;
  timerTicking: any;
  isFeedBackTriggeredSetter: (v: boolean) => void;
  lang: string;
  stonesCountRef: { value: number };
  counter?: number;
  width?: number;
}

export default class PuzzleHandler {
  private lastWordPuzzleDroppedLetters: string | null = null;
  private wordPuzzleLogic: WordPuzzleLogic | null = null;
  private letterPuzzleLogic: LetterPuzzleLogic | null = null;

  constructor(levelData: any, counter: number = 0) {
    this.initialize(levelData, counter);
    console.log('levelData', levelData)
  }

  initialize(levelData, counter) {
    // Only initialize for word puzzles, but you can expand as needed
    if (levelData && levelData.levelMeta && (levelData.levelMeta.levelType === "Word" || levelData.levelMeta.levelType === "SoundWord")) {
      this.wordPuzzleLogic = new WordPuzzleLogic(levelData, counter);
    } else {
      this.wordPuzzleLogic = null;
    }
    // Optionally: this.letterPuzzleLogic = new LetterPuzzleLogic();
  }

  /**
   * Main dispatcher for puzzle creation/stone drop.
   */
  createPuzzle(ctx: CreatePuzzleContext): boolean | void {
    switch (ctx.levelType) {
      case "LetterOnly":
      case "LetterInWord":
        return this.handleLetterPuzzle(ctx);
      case "Word":
      case "SoundWord":
        return this.handleWordPuzzle(ctx);
      default:
        return false;
    }
  }

  /**
   * Handles Letter puzzle logic.
   */
  private handleLetterPuzzle(ctx: CreatePuzzleContext): boolean | void {
    if (!this.letterPuzzleLogic) {
      this.letterPuzzleLogic = new LetterPuzzleLogic();
    }
    return this.letterPuzzleLogic.handleLetterStoneDrop({
      pickedStone: ctx.pickedStone,
      stoneHandler: ctx.stoneHandler,
      getRandomInt: (min: number, max: number) => this.getRandomInt(min, max, ctx.feedBackTexts),
      handleCorrectStoneDrop: ctx.handleCorrectStoneDrop,
      handleStoneDropEnd: ctx.handleStoneDropEnd,
      isFeedBackTriggeredSetter: ctx.isFeedBackTriggeredSetter,
    });
  }

  /**
   * Handles Word puzzle logic.
   */
  private handleWordPuzzle(ctx: CreatePuzzleContext): void {
    if (ctx.pickedStone.frame <= 99) return;
    ctx.audioPlayer.stopFeedbackAudio();
    ctx.pickedStone.x = -999;
    ctx.pickedStone.y = -999;
    const feedBackIndex = this.getRandomInt(0, 1, ctx.feedBackTexts);
    this.wordPuzzleLogic?.setGroupToDropped();
    const isCorrect = this.wordPuzzleLogic?.validateFedLetters();
    ctx.stoneHandler.processLetterDropFeedbackAudio(
      feedBackIndex,
      isCorrect,
      true,
      this.getWordPuzzleDroppedLetters()
    );
    if (isCorrect) {
      if (this.wordPuzzleLogic?.validateWordPuzzle()) {
        ctx.handleCorrectStoneDrop(feedBackIndex);
        ctx.handleStoneDropEnd(isCorrect, "Word");
        ctx.stonesCountRef.value = 1;
        return;
      }
      ctx.triggerMonsterAnimation('isMouthClosed');
      ctx.triggerMonsterAnimation('backToIdle');
      ctx.timerTicking.startTimer();
      const { droppedHistory } = this.wordPuzzleLogic?.getValues() ?? {};
      const droppedStonesCount = Object.keys(droppedHistory).length;
      ctx.promptText.droppedStoneIndex(
        ctx.lang == "arabic"
          ? ctx.stonesCountRef.value
          : droppedStonesCount
      );
      ctx.stonesCountRef.value++;
    } else {
      ctx.handleStoneDropEnd(isCorrect, "Word");
      ctx.stonesCountRef.value = 1;
    }
  }

  /**
   * Returns a random integer between min and max (inclusive), based on feedbackTexts.
   */
  getRandomInt(min: number, max: number, feedBackTexts: Record<string, string>): number {
    const feedbackValues = Object.values(feedBackTexts);
    const definedValuesMaxCount =
      feedbackValues.filter((value) => value != undefined).length - 1;
    return Math.floor(Math.random() * (definedValuesMaxCount - min + 1)) + min;
  }

  /**
   * Clears picked up state for word puzzles, if active.
   */
  clearPickedUp() {
    if (this.wordPuzzleLogic && typeof this.wordPuzzleLogic.clearPickedUp === 'function') {
      this.wordPuzzleLogic.clearPickedUp();
    }
  }

  /**
   * Checks if the current puzzle is a word puzzle.
   */
  checkIsWordPuzzle() {
    return this.wordPuzzleLogic && typeof this.wordPuzzleLogic.checkIsWordPuzzle === 'function'
      ? this.wordPuzzleLogic.checkIsWordPuzzle()
      : false;
  }

  /**
   * Returns the current values from wordPuzzleLogic, if available.
   */
  getWordPuzzleValues() {
    return this.wordPuzzleLogic && typeof this.wordPuzzleLogic.getValues === 'function'
      ? this.wordPuzzleLogic.getValues()
      : {};
  }

  /**
   * Returns the groupedObj from wordPuzzleLogic values, or an empty object if unavailable.
   */
  getWordPuzzleGroupedObj() {
    return this.wordPuzzleLogic?.getValues().groupedObj ?? {};
  }

  /**
   * Returns the droppedLetters from wordPuzzleLogic values, or undefined if unavailable.
   */
  getWordPuzzleDroppedLetters() {
    return this.wordPuzzleLogic?.getValues().droppedLetters;
  }

  /**
   * Handles checking hovered stone for word puzzles.
   */
  handleCheckHoveredStone(foilStoneText: string, foilStoneIndex: number) {
    return this.wordPuzzleLogic && typeof this.wordPuzzleLogic.handleCheckHoveredStone === 'function'
      ? this.wordPuzzleLogic.handleCheckHoveredStone(foilStoneText, foilStoneIndex)
      : undefined;
  }

  /**
   * Sets picked up letter for word puzzles.
   */
  setPickUpLetter(text: string, foilStoneIndex: number) {
    if (this.wordPuzzleLogic && typeof this.wordPuzzleLogic.setPickUpLetter === 'function') {
      this.wordPuzzleLogic.setPickUpLetter(text, foilStoneIndex);
    }
  }

  /**
   * Validates if a letter should be hidden for word puzzles.
   */
  validateShouldHideLetter(foilStoneIndex: number) {
    return this.wordPuzzleLogic && typeof this.wordPuzzleLogic.validateShouldHideLetter === 'function'
      ? this.wordPuzzleLogic.validateShouldHideLetter(foilStoneIndex)
      : false;
  }

  /**
   * Handles correct stone drop feedback logic.
   */
  handleCorrectStoneDrop(feedbackIndex: number, feedbackTextEffects: any, getRandomFeedBackText: (idx: number) => string, addScore: (amount: number) => void) {
    addScore(100);
    const feedbackText = getRandomFeedBackText(feedbackIndex);
    // Show feedback text immediately
    feedbackTextEffects.wrapText(feedbackText);
    // Wait for feedback audio to finish
    const totalAudioDuration = 4500; // Approximate total duration of all feedback audio (eating + cheering + points)
    setTimeout(() => {
      feedbackTextEffects.hideText();
    }, totalAudioDuration);
  }
}