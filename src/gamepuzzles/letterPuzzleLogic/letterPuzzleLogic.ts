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
   * Handles the logic for a letter puzzle.
   * Returns whether the drop is correct and triggers feedback.
   * 
   * @param params Object containing all necessary parameters for handling letter puzzle
   * @returns True if the letter drop was correct, false otherwise
   */
  handleLetterDrop({
    droppedText,
    getRandomInt,
    handleCorrectLetterDrop,
    handleLetterDropEnd,
    isFeedBackTriggeredSetter,
    playFeedbackAudio
  }) {
    // Get a random feedback index
    const feedBackIndex = getRandomInt(0, 1);
    
    // Check if the letter drop is correct
    const isCorrect = this.validateLetterDrop(droppedText);
    
    // Play appropriate audio feedback
    playFeedbackAudio(feedBackIndex, isCorrect, false, droppedText);
    
    // Handle correct letter drop if needed
    if (isCorrect) {
      handleCorrectLetterDrop(feedBackIndex);
    }
    
    // Set feedback triggered state and handle letter drop end
    isFeedBackTriggeredSetter(true);
    handleLetterDropEnd(isCorrect, "Letter");
    
    return isCorrect;
  }
  
  /**
   * Resets the internal state of the letter puzzle logic
   */
  reset(): void {
    this.targetLetter = null;
  }
}
