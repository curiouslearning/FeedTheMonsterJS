import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';

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
   * Handles a stone drop event for any puzzle type.
   * Accepts a context object with all required dependencies and state references.
   * Returns a boolean indicating if the stone was dropped correctly.
   */
  createPuzzle({
    levelType,
    pickedStone,
    stoneHandler,
    audioPlayer,
    promptText,
    feedBackTexts,
    handleCorrectStoneDrop,
    handleStoneDropEnd,
    triggerMonsterAnimation,
    timerTicking,
    isFeedBackTriggeredSetter,
    lang,
    stonesCountRef,
  }) {
    switch (levelType) {
      case "LetterOnly":
      case "LetterInWord": {
        if (!this.letterPuzzleLogic) {
          this.letterPuzzleLogic = new LetterPuzzleLogic();
        }
        return this.letterPuzzleLogic.handleLetterStoneDrop({
          pickedStone,
          stoneHandler,
          getRandomInt: (min, max) => this.getRandomInt(min, max, feedBackTexts),
          handleCorrectStoneDrop,
          handleStoneDropEnd,
          isFeedBackTriggeredSetter
        });
      }
      case "Word":
      case "SoundWord": {
        if (pickedStone.frame <= 99) {
          return; // Prevent dragging if the stone is animating
        }
        audioPlayer.stopFeedbackAudio();
        pickedStone.x = -999;
        pickedStone.y = -999;
        const feedBackIndex = this.getRandomInt(0, 1, feedBackTexts);
        this.wordPuzzleLogic.setGroupToDropped();
        const { droppedLetters } = this.wordPuzzleLogic.getValues();
        const isCorrect = this.wordPuzzleLogic.validateFedLetters();
        stoneHandler.processLetterDropFeedbackAudio(
          feedBackIndex,
          isCorrect,
          true,
          droppedLetters
        );
        if (isCorrect) {
          if (this.wordPuzzleLogic.validateWordPuzzle()) {
            handleCorrectStoneDrop(feedBackIndex);
            handleStoneDropEnd(isCorrect, "Word");
            stonesCountRef.value = 1;
            return;
          }
          triggerMonsterAnimation('isMouthClosed');
          triggerMonsterAnimation('backToIdle');
          timerTicking.startTimer();
          const { droppedHistory } = this.wordPuzzleLogic.getValues();
          const droppedStonesCount = Object.keys(droppedHistory).length;
          promptText.droppedStoneIndex(
            lang == "arabic"
              ? stonesCountRef.value
              : droppedStonesCount
          );
          stonesCountRef.value++;
        } else {
          handleStoneDropEnd(isCorrect, "Word");
          stonesCountRef.value = 1;
        }
        return;
      }
      default:
        return false;
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