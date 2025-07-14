import { FeedbackType } from '@gamepuzzles';

/**
 * Handles all logic for LetterOnly and LetterInWord puzzles.
 * Responsible for puzzle validation and game flow.
 */
export default class LetterPuzzleLogic {
  private targetLetter: string | null = null;
  
  /**
   * Sets the target letter for validation
   * @param targetLetter The correct target letter
   */
  setTargetLetter(targetLetter: string): void {
    this.targetLetter = targetLetter;
  }
  
  /**
   * Validates if the dropped letter matches the target letter
   * @param droppedLetter The letter that was dropped
   * @returns True if the letter matches the target, false otherwise
   */
  validateLetterDrop(droppedLetter: string): boolean {
    if (!this.targetLetter) return false;
    return droppedLetter === this.targetLetter;
  }

  /**
   * Resets the internal state of the letter puzzle logic
   */
  reset(): void {
    this.targetLetter = null;
  }
}
