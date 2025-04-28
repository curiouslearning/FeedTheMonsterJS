import { StoneConfig } from '@common';
import { AudioPlayer } from '@components';
import { GameScore } from '@data';
import FeedbackAudioHandler, { FeedbackType } from '@gamepuzzles/feedbackAudioHandler/feedbackAudioHandler';

/**
 * Handles all logic for LetterOnly and LetterInWord puzzles.
 * Consolidates letter puzzle logic from GameplayScene and StoneHandler.
 */
export default class LetterPuzzleLogic {
  private feedBackTexts: any;
  private audioPlayer: AudioPlayer;
  private stoneHandler: any;
  private score: number;
  private pickedStone: StoneConfig | null;
  public isFeedBackTriggered: boolean;
  private feedbackAudioHandler: FeedbackAudioHandler;

  constructor(feedBackTexts: any, audioPlayer: AudioPlayer, stoneHandler: any) {
    this.feedBackTexts = feedBackTexts;
    this.audioPlayer = audioPlayer;
    this.stoneHandler = stoneHandler;
    this.score = 0;
    this.pickedStone = null;
    this.isFeedBackTriggered = false;
    this.feedbackAudioHandler = new FeedbackAudioHandler(this.audioPlayer);
  }

  /**
   * Sets the currently picked stone.
   * @param stone The stone to be picked, or null to clear selection.
   */
  setPickedStone(stone: StoneConfig | null) {
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
   * @param feedBackIndex Index for feedback audio/text.
   * @returns True if the drop is correct, false otherwise.
   */
  checkStoneDropped(droppedStone: string, feedBackIndex: number): boolean {
    // Letter puzzle only: droppedStone must match correctTargetStone
    const isLetterDropCorrect = droppedStone === this.stoneHandler.correctTargetStone;
    this.processLetterDropFeedbackAudio(feedBackIndex, isLetterDropCorrect, false, droppedStone);
    return isLetterDropCorrect;
  }

  /**
   * Handles the logic for dropping a letter stone.
   * Returns result object with isCorrect, feedbackIndex, and feedbackText.
   * @param droppedStone The stone dropped by the player.
   * @returns Object containing isCorrect, feedbackIndex, and feedbackText.
   */
  letterPuzzle(droppedStone: string) {
    if (this.pickedStone && this.pickedStone.frame <= 99) {
      return { isCorrect: false, feedbackIndex: null, feedbackText: null };
    }
    const feedBackIndex = this.getRandomInt(0, 1);
    const isCorrect = this.checkStoneDropped(droppedStone, feedBackIndex);
    this.isFeedBackTriggered = true;
    let feedbackText = this.getRandomFeedBackText(feedBackIndex);
    if (isCorrect) {
      this.score += 100;
    }
    return { isCorrect, feedbackIndex: feedBackIndex, feedbackText };
  }

  /**
   * Finds and returns the stone under the cursor position, if any.
   * @param posX Cursor X position.
   * @param posY Cursor Y position.
   * @returns The stone object under the cursor, or null if none found.
   */
  handlePickStoneUp(posX: number, posY: number) {
    let stoneLetter = null;
    let ctr = 0;
    for (let sc of this.stoneHandler.foilStones) {
      const distance = this.computeCursorDistance(posX, posY, sc);
      if (distance <= 40) {
        stoneLetter = sc;
        stoneLetter['foilStoneIndex'] = ctr;
        break;
      }
      ctr++;
    }
    return stoneLetter;
  }

  /**
   * Computes the Euclidean distance between the cursor and a stone.
   * @param posX Cursor X position.
   * @param posY Cursor Y position.
   * @param sc Stone config object with x and y.
   * @returns Distance between cursor and stone.
   */
  computeCursorDistance(posX: number, posY: number, sc: any): number {
    return Math.sqrt((posX - sc.x) ** 2 + (posY - sc.y) ** 2);
  }

  /**
   * Resets the position of the picked stone to its original location, with optional offset for short text.
   * @param width Width of the area.
   * @param pickedStone The stone to reposition.
   * @param pickedStoneObject The reference stone object with original coordinates.
   * @returns The repositioned stone object.
   */
  resetStonePosition(width: number, pickedStone: StoneConfig, pickedStoneObject: StoneConfig) {
    const stone = pickedStone;
    const stoneObj = pickedStoneObject;
    if (
      stone &&
      stoneObj &&
      stone.text &&
      typeof stoneObj.origx === "number" &&
      typeof stoneObj.origy === "number"
    ) {
      const xLimit = 50;
      const halfWidth = width / 2;
      stone.x = stone.text.length <= 3 && stoneObj.origx < xLimit && stoneObj.origx < halfWidth
        ? stoneObj.origx + 25
        : stoneObj.origx;
      stone.y = stoneObj.origy;
    }
    return stone;
  }

  /**
   * Plays feedback audio for a letter drop event based on correctness and context.
   * @param feedBackIndex Index for feedback audio/text.
   * @param isLetterDropCorrect Whether the letter drop was correct.
   * @param isWord Whether this is a word puzzle.
   * @param droppedStone The stone dropped by the player.
   */
  processLetterDropFeedbackAudio(
    feedBackIndex: number,
    isLetterDropCorrect: boolean,
    isWord: boolean,
    droppedStone: string
  ) {
    if (isLetterDropCorrect) {
      const condition = isWord
        ? droppedStone === this.stoneHandler.getCorrectTargetStone()
        : isLetterDropCorrect;
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
