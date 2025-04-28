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

  setPickedStone(stone: StoneConfig | null) {
    this.pickedStone = stone;
  }

  getRandomFeedBackText(randomIndex: number): string {
    const keys = Object.keys(this.feedBackTexts);
    const selectedKey = keys[randomIndex];
    return this.feedBackTexts[selectedKey] as string;
  }

  getRandomInt(min: number, max: number): number {
    const feedbackValues = Object.values(this.feedBackTexts);
    const definedValuesMaxCount =
      feedbackValues.filter((value) => value != undefined).length - 1;
    return Math.floor(Math.random() * (definedValuesMaxCount - min + 1)) + min;
  }

  /**
   * Checks if the dropped stone is correct for letter puzzles.
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

  computeCursorDistance(posX: number, posY: number, sc: any): number {
    return Math.sqrt((posX - sc.x) ** 2 + (posY - sc.y) ** 2);
  }

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

  resetFeedbackTrigger() {
    this.isFeedBackTriggered = false;
  }

  getScore() {
    return this.score;
  }
}
