import { AudioPlayer } from '@components';
import FeedbackAudioHandler, { FeedbackType } from '@gamepuzzles/feedbackAudioHandler/feedbackAudioHandler';

/**
 * Handles all logic for LetterOnly and LetterInWord puzzles.
 * Consolidates letter puzzle logic from GameplayScene and StoneHandler.
 * This class is UI-agnostic and does not depend on StoneConfig.
 */
export default class LetterPuzzleLogic {
  private feedBackTexts: any;
  private stoneHandler: any;
  private score: number;
  private pickedStone: any | null; 
  public isFeedBackTriggered: boolean;

  constructor(feedBackTexts: any, stoneHandler: any) {
    this.feedBackTexts = feedBackTexts;
    this.stoneHandler = stoneHandler;
    this.score = 0;
    this.pickedStone = null;
    this.isFeedBackTriggered = false;
  }

  /**
   * Sets the currently picked stone.
   * @param stone The stone to be picked, or null to clear selection.
   */
  setPickedStone(stone: any | null) {
    this.pickedStone = stone;
  }

  /**
   * Returns a random feedback text based on the provided index.
   * @param randomIndex Index to select feedback text.
   * @returns Feedback text string.
   */
  getRandomFeedBackText(randomIndex: number): string {
    const keys = Object.keys(this.feedBackTexts);
    const selectedKey = keys[randomIndex];
    return this.feedBackTexts[selectedKey] as string;
  }

  /**
   * Returns a random integer between min and the number of defined feedback texts.
   * @param min Minimum value (inclusive).
   * @param max Maximum value (inclusive).
   * @returns Random integer in the range.
   */
  getRandomInt(min: number, max: number): number {
    const feedbackValues = Object.values(this.feedBackTexts);
    const definedValuesMaxCount =
      feedbackValues.filter((value) => value != undefined).length - 1;
    return Math.floor(Math.random() * (definedValuesMaxCount - min + 1)) + min;
  }

  /**
   * Checks if the dropped stone is correct for letter puzzles and triggers feedback audio.
   * @param droppedStone The stone dropped by the player.
   * @param correctTargetStone The correct target stone.
   * @param feedBackIndex Index for feedback audio/text.
   * @returns True if the drop is correct, false otherwise.
   */
  checkStoneDropped(droppedStone: string, correctTargetStone: string, feedBackIndex: number): boolean {
    const isLetterDropCorrect = droppedStone === correctTargetStone;
    if (typeof this.stoneHandler.processLetterDropFeedbackAudio === 'function') {
      this.stoneHandler.processLetterDropFeedbackAudio(feedBackIndex, isLetterDropCorrect, false, droppedStone);
    }
    return isLetterDropCorrect;
  }

  /**
   * Handles the logic for dropping a letter stone.
   * Returns result object with isCorrect, feedbackIndex, and feedbackText.
   * @param droppedStone The stone dropped by the player.
   * @param correctTargetStone The correct target stone.
   * @param frame The frame value of the picked stone (stone state).
   * @returns Object containing isCorrect, feedbackIndex, and feedbackText.
   */
  letterPuzzle(droppedStone: string, correctTargetStone: string, frame: number) {
    if (frame <= 99) {
      return { isCorrect: false, feedbackIndex: null, feedbackText: null };
    }
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect = this.checkStoneDropped(droppedStone, correctTargetStone, feedBackIndex);
    this.isFeedBackTriggered = true;
    let feedbackText = this.getRandomFeedBackText(feedBackIndex);
    if (isCorrect) {
      this.score += 100;
    }
    return { isCorrect, feedbackIndex: feedBackIndex, feedbackText };
  }

  /**
   * Resets the feedback trigger flag to false.
   */
  resetFeedbackTrigger() {
    this.isFeedBackTriggered = false;
  }

  /**
   * Returns the current score for the letter puzzle.
   * @returns The current score.
   */
  getScore() {
    return this.score;
  }
}
