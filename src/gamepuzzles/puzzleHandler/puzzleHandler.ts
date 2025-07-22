import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';
import { FeedbackTextEffects } from '@components/feedback-text';
import { FeedbackAudioHandler, FeedbackType } from '@gamepuzzles';
import gameStateService from '@gameStateService';

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
  promptText: any;
  feedBackTexts: Record<string, string>;
  handleLetterDropEnd: (isCorrect: boolean, type: string) => void;
  triggerMonsterAnimation: (name: string) => void;
  timerTicking: any;
  lang: string;
  lettersCountRef: { value: number };
}

/**
 * PuzzleHandler is responsible for delegating puzzle logic to the appropriate
 * specialized puzzle logic class based on the level type.
 */
export default class PuzzleHandler {
  private wordPuzzleLogic: WordPuzzleLogic | null = null;
  private letterPuzzleLogic: LetterPuzzleLogic | null = null;
  private feedbackAudioHandler: FeedbackAudioHandler;
  private feedbackTextEffects: FeedbackTextEffects

  constructor(levelData: any, counter: number = 0, feedbackAudios?: any) {
    // Initialize feedback audio handler if audio resources are provided
    if (feedbackAudios) {
      this.feedbackAudioHandler = new FeedbackAudioHandler(feedbackAudios);
    }
    this.feedbackTextEffects = new FeedbackTextEffects();
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
      this.letterPuzzleLogic = new LetterPuzzleLogic();
    }
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
  private handleLetterPuzzle(ctx: CreatePuzzleContext) {
    this.letterPuzzleLogic.setTargetLetter(ctx.targetLetterText);

    const droppedText = ctx.pickedLetter.text;

    // Get a random feedback index
    const feedBackIndex = this.getRandomInt(0, 1, ctx.feedBackTexts);
    const isCorrect = this.letterPuzzleLogic.validateLetterDrop(droppedText);

    // Play appropriate audio feedback
    this.processLetterDropFeedbackAudio(
      ctx.targetLetterText,
      feedBackIndex,
      isCorrect,
      false,
      droppedText
    );

    if (isCorrect) {
      // Handle correct letter drop if needed
      this.handleCorrectLetterDrop(feedBackIndex, ctx);
    }

    ctx.handleLetterDropEnd(isCorrect, "Letter");
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
      const isWordSpellingCorrect = this.wordPuzzleLogic.validateWordPuzzle();
      if (isWordSpellingCorrect) {
        this.handleCorrectLetterDrop(feedBackIndex, ctx);
        ctx.handleLetterDropEnd(isWordSpellingCorrect, "Word");
        ctx.lettersCountRef.value = 1;
        return;
      }

      ctx.triggerMonsterAnimation('isMouthClosed');
      ctx.triggerMonsterAnimation('backToIdle');
      ctx.timerTicking.startTimer();

      const { droppedHistory } = this.wordPuzzleLogic.getValues();
      const droppedLettersCount = ctx.lang === "arabic"
        ? ctx.lettersCountRef.value
        : Object.keys(droppedHistory).length;

      gameStateService.publish(
        gameStateService.EVENTS.WORD_PUZZLE_SUBMITTED_LETTERS_COUNT,
        droppedLettersCount
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
  handleCheckHoveredLetter(letterText: string, letterIndex: number): boolean {
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
    ctx: CreatePuzzleContext,
  ): void {

    
    // Get feedback text and display it
    const feedbackText = this.getRandomFeedBackText(feedbackIndex, ctx.feedBackTexts);
    this.feedbackTextEffects.wrapText(feedbackText);
    
    // Hide feedback text after audio finishes
    const totalAudioDuration = 4500; // Approximate duration of feedback audio
    setTimeout(() => {
      this.feedbackTextEffects.hideText();
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