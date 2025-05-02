import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';
import { FeedbackTextEffects } from '@components/feedback-text';
import { FeedbackAudioHandler, FeedbackType } from '@gamepuzzles';

/**
 * Context object for creating a puzzle/handling a letter drop.
 */
interface CreatePuzzleContext {
  levelType: string;
  pickedLetter: {
    text: string;
    frame: number;
  };
  targetLetterText: string; // Instead of passing the entire letterHandler
  audioPlayer: any;
  promptText: any;
  feedBackTexts: Record<string, string>;
  handleCorrectLetterDrop: (feedbackIndex: number) => void;
  handleLetterDropEnd: (isCorrect: boolean, type: string) => void;
  triggerMonsterAnimation: (name: string) => void;
  timerTicking: any;
  isFeedBackTriggeredSetter: (v: boolean) => void;
  lang: string;
  lettersCountRef: { value: number };
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
  private feedbackAudioHandler: FeedbackAudioHandler;

  constructor(levelData: any, counter: number = 0, feedbackAudios?: any) {
    // Initialize feedback audio handler if audio resources are provided
    if (feedbackAudios) {
      this.feedbackAudioHandler = new FeedbackAudioHandler(feedbackAudios);
    }
    
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
   * Main dispatcher for puzzle creation/letter drop.
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
      this.letterPuzzleLogic.setTargetLetter(ctx.targetLetterText);
    }
    
    return this.letterPuzzleLogic.handleLetterDrop({
      droppedText: ctx.pickedLetter.text,
      getRandomInt: (min: number, max: number) => this.getRandomInt(min, max, ctx.feedBackTexts),
      handleCorrectLetterDrop: ctx.handleCorrectLetterDrop,
      handleLetterDropEnd: ctx.handleLetterDropEnd,
      isFeedBackTriggeredSetter: ctx.isFeedBackTriggeredSetter,
      playFeedbackAudio: (feedBackIndex, isCorrect, isWord, droppedLetter) => {
        this.processLetterDropFeedbackAudio(
          ctx.targetLetterText,
          feedBackIndex,
          isCorrect,
          isWord,
          droppedLetter
        );
      }
    });
  }

  /**
   * Handles Word puzzle logic.
   */
  private handleWordPuzzle(ctx: CreatePuzzleContext): void {
    if (!this.wordPuzzleLogic) return;
    
    // Use our own stopFeedbackAudio method instead of ctx.audioPlayer
    this.stopFeedbackAudio();
    
    const feedBackIndex = this.getRandomInt(0, 1, ctx.feedBackTexts);
    this.wordPuzzleLogic.setGroupToDropped();
    const isCorrect = this.wordPuzzleLogic.validateFedLetters();
    
    this.processLetterDropFeedbackAudio(
      ctx.targetLetterText,
      feedBackIndex,
      isCorrect,
      true,
      this.getWordPuzzleDroppedLetters()
    );
    
    if (isCorrect) {
      if (this.wordPuzzleLogic.validateWordPuzzle()) {
        ctx.handleCorrectLetterDrop(feedBackIndex);
        ctx.handleLetterDropEnd(isCorrect, "Word");
        ctx.lettersCountRef.value = 1;
        return;
      }
      
      ctx.triggerMonsterAnimation('isMouthClosed');
      ctx.triggerMonsterAnimation('backToIdle');
      ctx.timerTicking.startTimer();
      
      const { droppedHistory } = this.wordPuzzleLogic.getValues();
      const droppedLettersCount = Object.keys(droppedHistory).length;
      
      ctx.promptText.droppedLetterIndex(
        ctx.lang === "arabic" ? ctx.lettersCountRef.value : droppedLettersCount
      );
      
      ctx.lettersCountRef.value++;
    } else {
      ctx.handleLetterDropEnd(isCorrect, "Word");
      ctx.lettersCountRef.value = 1;
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
   * Processes audio feedback for letter drops based on correctness
   */
  processLetterDropFeedbackAudio(
    targetLetterText: string,
    feedBackIndex: number,
    isLetterDropCorrect: boolean,
    isWord: boolean,
    droppedLetter: string,
  ) {
    if (!this.feedbackAudioHandler) {
      return; // No audio handler available
    }
    
    if (isLetterDropCorrect) {
      const condition = isWord
        ? droppedLetter === targetLetterText // condition for word puzzle
        : isLetterDropCorrect // for letter and letter for word puzzle

      if (condition) {
        this.feedbackAudioHandler.playFeedback(FeedbackType.CORRECT_ANSWER, feedBackIndex);
      } else {
        this.feedbackAudioHandler.playFeedback(FeedbackType.PARTIAL_CORRECT, feedBackIndex);
      }
    } else {
      this.feedbackAudioHandler.playFeedback(FeedbackType.INCORRECT, feedBackIndex);
    }
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
   * Handles checking hovered letter for word puzzles.
   */
  handleCheckHoveredLetter(letterText: string, letterIndex: number): boolean | undefined {
    return this.wordPuzzleLogic?.handleCheckHoveredLetter(letterText, letterIndex);
  }

  /**
   * Sets picked up letter for word puzzles.
   */
  setPickUpLetter(text: string, letterIndex: number): void {
    if (this.wordPuzzleLogic) {
      this.wordPuzzleLogic.setPickUpLetter(text, letterIndex);
    }
  }

  /**
   * Validates if a letter should be hidden for word puzzles.
   */
  validateShouldHideLetter(letterIndex: number): boolean {
    return this.wordPuzzleLogic ? this.wordPuzzleLogic.validateShouldHideLetter(letterIndex) : false;
  }

  /**
   * Handles correct letter drop feedback logic.
   */
  handleCorrectLetterDrop(
    feedbackIndex: number,
    feedbackTextEffects: FeedbackTextEffects,
    ctx: CreatePuzzleContext,
    addScore: (amount: number) => void
  ): void {
    /**
     The hardcoded value was carried over from the original implementation. The key change is that instead of directly modifying a score property (this.score += 100), we now call an injected function (addScore(100)). This improves separation of concerns - the PuzzleHandler doesn't manage the score directly but delegates that responsibility to the caller. In a future refactoring, this value could be made configurable rather than hardcoded.
     */
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

  /**
   * Stops all currently playing feedback audio
   */
  stopFeedbackAudio(): void {
    if (this.feedbackAudioHandler) {
      this.feedbackAudioHandler.stopAllAudio();
    }
  }

  /**
   * Cleans up resources used by the puzzle handler
   */
  dispose(): void {
    if (this.feedbackAudioHandler) {
      this.feedbackAudioHandler.dispose();
    }
  }
}