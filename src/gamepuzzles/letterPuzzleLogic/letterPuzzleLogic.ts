/**
 * Handles all logic for LetterOnly and LetterInWord puzzles.
 * Stateless: all logic is performed via the main method, no internal state is tracked.
 */
export default class LetterPuzzleLogic {
  /**
   * Handles the logic for dropping a letter stone.
   * Returns whether the drop is correct and triggers feedback.
   * @param pickedStone The picked stone object.
   * @param stoneHandler The stone handler instance.
   * @param getRandomInt Function to get a random int for feedback.
   * @param handleCorrectStoneDrop Callback for correct drop.
   * @param handleStoneDropEnd Callback for end of drop.
   * @param isFeedBackTriggeredSetter Callback to set feedback triggered state.
   * @returns True if correct, false otherwise.
   */
  handleLetterStoneDrop({
    pickedStone,
    stoneHandler,
    getRandomInt,
    handleCorrectStoneDrop,
    handleStoneDropEnd,
    isFeedBackTriggeredSetter
  }) {
    if (pickedStone && pickedStone.frame <= 99) {
      return false; // Prevent dragging if the stone is animating
    }
    const feedBackIndex = getRandomInt(0, 1);
    const isCorrect = stoneHandler.isStoneLetterDropCorrect(
      pickedStone.text,
      feedBackIndex
    );
    if (isCorrect) {
      handleCorrectStoneDrop(feedBackIndex);
    }
    isFeedBackTriggeredSetter(true);
    handleStoneDropEnd(isCorrect);
    return isCorrect;
  }
}
