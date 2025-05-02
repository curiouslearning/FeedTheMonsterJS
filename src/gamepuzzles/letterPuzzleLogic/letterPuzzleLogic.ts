/**
 * Handles all logic for LetterOnly and LetterInWord puzzles.
 * Stateless: all logic is performed via the main method, no internal state is tracked.
 */
export default class LetterPuzzleLogic {
  /**
   * Handles the logic for dropping a letter stone.
   * Returns whether the drop is correct and triggers feedback.
   * 
   * @param params Object containing all necessary parameters for handling letter stone drop
   * @returns True if the stone drop was correct, false otherwise
   */
  handleLetterStoneDrop({
    pickedStone,
    stoneHandler,
    getRandomInt,
    handleCorrectStoneDrop,
    handleStoneDropEnd,
    isFeedBackTriggeredSetter
  }) {
    // Prevent dragging if the stone is animating
    if (!pickedStone || pickedStone.frame <= 99) {
      return false;
    }
    
    // Get a random feedback index
    const feedBackIndex = getRandomInt(0, 1);
    
    // Check if the stone drop is correct
    const isCorrect = stoneHandler.isStoneLetterDropCorrect(
      pickedStone.text,
      feedBackIndex
    );
    
    // Handle correct stone drop if needed
    if (isCorrect) {
      handleCorrectStoneDrop(feedBackIndex);
    }
    
    // Set feedback triggered state and handle stone drop end
    isFeedBackTriggeredSetter(true);
    handleStoneDropEnd(isCorrect);
    
    return isCorrect;
  }
}
