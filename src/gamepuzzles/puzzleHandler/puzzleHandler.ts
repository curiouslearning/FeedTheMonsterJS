import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';
import { FeedbackTextEffects } from '@components/feedback-text';

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

/**
 * PuzzleHandler is responsible for delegating puzzle logic to the appropriate
 * specialized puzzle logic class based on the level type.
 */
export default class PuzzleHandler {
  private wordPuzzleLogic: WordPuzzleLogic | null = null;
  private letterPuzzleLogic: LetterPuzzleLogic | null = null;

  constructor(levelData: any, counter: number = 0) {
    this.initialize(levelData, counter);
  }

  /**
   * Initialize the appropriate puzzle logic based on level type.
   */
  initialize(levelData: any, counter: number): void {
    if (!levelData || !levelData.levelMeta) return;
    
    const { levelType } = levelData.levelMeta;
    
    // Initialize word puzzle logic for Word and SoundWord types
    if (levelType === "Word" || levelType === "SoundWord") {
      this.wordPuzzleLogic = new WordPuzzleLogic(levelData, counter);
    } else {
      this.wordPuzzleLogic = null;
    }
    
    // Letter puzzle logic is created on demand in handleLetterPuzzle
    this.letterPuzzleLogic = null;
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
    if (!this.wordPuzzleLogic || ctx.pickedStone.frame <= 99) return;
    
    ctx.audioPlayer.stopFeedbackAudio();
    ctx.pickedStone.x = -999;
    ctx.pickedStone.y = -999;
    
    const feedBackIndex = this.getRandomInt(0, 1, ctx.feedBackTexts);
    this.wordPuzzleLogic.setGroupToDropped();
    const isCorrect = this.wordPuzzleLogic.validateFedLetters();
    
    ctx.stoneHandler.processLetterDropFeedbackAudio(
      feedBackIndex,
      isCorrect,
      true,
      this.getWordPuzzleDroppedLetters()
    );
    
    if (isCorrect) {
      if (this.wordPuzzleLogic.validateWordPuzzle()) {
        ctx.handleCorrectStoneDrop(feedBackIndex);
        ctx.handleStoneDropEnd(isCorrect, "Word");
        ctx.stonesCountRef.value = 1;
        return;
      }
      
      ctx.triggerMonsterAnimation('isMouthClosed');
      ctx.triggerMonsterAnimation('backToIdle');
      ctx.timerTicking.startTimer();
      
      const { droppedHistory } = this.wordPuzzleLogic.getValues();
      const droppedStonesCount = Object.keys(droppedHistory).length;
      
      ctx.promptText.droppedStoneIndex(
        ctx.lang === "arabic" ? ctx.stonesCountRef.value : droppedStonesCount
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
    const definedValuesMaxCount = feedbackValues.filter(value => value != undefined).length - 1;
    return Math.floor(Math.random() * (definedValuesMaxCount - min + 1)) + min;
  }

  /**
   * Returns a random feedback text from the provided feedbackTexts object.
   */
  getRandomFeedBackText(randomIndex: number, feedBackTexts: Record<string, string>): string {
    const keys = Object.keys(feedBackTexts);
    const selectedKey = keys[randomIndex];
    return feedBackTexts[selectedKey] || '';
  }

  /**
   * Clears picked up state for word puzzles, if active.
   */
  clearPickedUp(): void {
    if (this.wordPuzzleLogic) {
      this.wordPuzzleLogic.clearPickedUp();
    }
  }

  /**
   * Checks if the current puzzle is a word puzzle.
   */
  checkIsWordPuzzle(): boolean {
    return this.wordPuzzleLogic ? this.wordPuzzleLogic.checkIsWordPuzzle() : false;
  }

  /**
   * Returns the current values from wordPuzzleLogic, if available.
   */
  getWordPuzzleValues(): any {
    return this.wordPuzzleLogic ? this.wordPuzzleLogic.getValues() : {};
  }

  /**
   * Returns the groupedObj from wordPuzzleLogic values, or an empty object if unavailable.
   */
  getWordPuzzleGroupedObj(): Record<number, string> {
    return this.wordPuzzleLogic?.getValues().groupedObj ?? {};
  }

  /**
   * Returns the droppedLetters from wordPuzzleLogic values, or undefined if unavailable.
   */
  getWordPuzzleDroppedLetters(): string | undefined {
    return this.wordPuzzleLogic?.getValues().droppedLetters;
  }

  /**
   * Handles checking hovered stone for word puzzles.
   */
  handleCheckHoveredStone(foilStoneText: string, foilStoneIndex: number): boolean | undefined {
    return this.wordPuzzleLogic?.handleCheckHoveredStone(foilStoneText, foilStoneIndex);
  }

  /**
   * Sets picked up letter for word puzzles.
   */
  setPickUpLetter(text: string, foilStoneIndex: number): void {
    if (this.wordPuzzleLogic) {
      this.wordPuzzleLogic.setPickUpLetter(text, foilStoneIndex);
    }
  }

  /**
   * Validates if a letter should be hidden for word puzzles.
   */
  validateShouldHideLetter(foilStoneIndex: number): boolean {
    return this.wordPuzzleLogic ? this.wordPuzzleLogic.validateShouldHideLetter(foilStoneIndex) : false;
  }

  /**
   * Handles correct stone drop feedback logic.
   */
  handleCorrectStoneDrop(
    feedbackIndex: number,
    feedbackTextEffects: FeedbackTextEffects,
    ctx: CreatePuzzleContext,
    addScore: (amount: number) => void
  ): void {
    // Add score
    addScore(100);
    
    // Get feedback text and display it
    const feedbackText = this.getRandomFeedBackText(feedbackIndex, ctx.feedBackTexts);
    feedbackTextEffects.wrapText(feedbackText);
    
    // Hide feedback text after audio finishes
    const totalAudioDuration = 4500; // Approximate duration of feedback audio
    setTimeout(() => {
      feedbackTextEffects.hideText();
    }, totalAudioDuration);
  }
}