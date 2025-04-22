import BasePuzzleLogic from '../basePuzzleLogic/basePuzzleLogic';

/**
 * Handles logic for Letter Only and Letter In Word puzzles
 */
export default class LetterPuzzleLogic extends BasePuzzleLogic {
  private currentLetter: string = '';

  constructor(levelData, puzzleNumber) {
    super(levelData, puzzleNumber);
  }

  /**
   * Checks if the dropped stone letter is correct
   * @param droppedStone - The letter that was dropped
   * @returns boolean indicating if the dropped letter is correct
   */
  override isLetterDropCorrect(droppedStone: string): boolean {
    const targetLetter = this.getCorrectTargetStone();
    return droppedStone === targetLetter;
  }

  /**
   * Gets the correct target letter
   * @returns string - The correct target letter
   */
  override getCorrectTargetStone(): string {
    // For both LetterOnly and LetterInWord, the target letter is in targetStones[0]
    return this.levelData.puzzles[this.puzzleNumber]?.targetStones[0];
  }

  /**
   * Checks if the puzzle is completed
   * @returns boolean indicating if the puzzle is completed
   */
  override validatePuzzleCompletion(): boolean {
    // For letter puzzles, completion is determined by a single correct letter drop
    return this.currentLetter === this.getCorrectTargetStone();
  }

  /**
   * Sets the current letter that was dropped
   * @param letter - The letter that was dropped
   */
  setCurrentLetter(letter: string): void {
    this.currentLetter = letter;
  }

  /**
   * Clears the current letter
   */
  clearCurrentLetter(): void {
    this.currentLetter = '';
  }

  /**
   * Gets the current letter
   * @returns The current letter
   */
  getCurrentLetter(): string {
    return this.currentLetter;
  }

  /**
   * Checks if this is a letter puzzle (LetterOnly or LetterInWord)
   * @returns boolean indicating if this is a letter puzzle
   */
  isLetterPuzzle(): boolean {
    const puzzleType = this.getPuzzleType();
    return puzzleType === 'LetterOnly' || puzzleType === 'LetterInWord';
  }

  /**
   * Updates the puzzle level
   * @param puzzleNumber - The new puzzle number
   */
  override updatePuzzleLevel(puzzleNumber: number): void {
    super.updatePuzzleLevel(puzzleNumber);
    this.clearCurrentLetter();
  }
}
