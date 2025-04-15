import BasePuzzleLogic from '../basePuzzleLogic/basePuzzleLogic';

/**
 * Handles logic for Sound Word puzzles
 * Similar to Word puzzles but with sound-based interactions
 */
export default class SoundWordPuzzleLogic extends BasePuzzleLogic {
  private droppedLetters: string = '';

  constructor(levelData, puzzleNumber) {
    super(levelData, puzzleNumber);
  }

  /**
   * Checks if the dropped stone letter is correct
   * @param droppedStone - The letter or word that was dropped
   * @param isWord - Whether this is a complete word
   * @returns boolean indicating if the dropped letter/word is correct
   */
  override isLetterDropCorrect(droppedStone: string, isWord: boolean = true): boolean {
    const targetWord = this.getTargetText();
    // For sound word puzzles, we check if the dropped stone matches the target word
    return droppedStone === targetWord.substring(0, droppedStone.length);
  }

  /**
   * Gets the correct target word
   * @returns string - The correct target word
   */
  override getCorrectTargetStone(): string {
    return this.getTargetText();
  }

  /**
   * Checks if the puzzle is completed
   * @returns boolean indicating if the puzzle is completed
   */
  override validatePuzzleCompletion(): boolean {
    return this.droppedLetters === this.getTargetText();
  }

  /**
   * Sets the dropped letters
   * @param letters - The letters that were dropped
   */
  setDroppedLetters(letters: string): void {
    this.droppedLetters = letters;
  }

  /**
   * Appends letters to the dropped letters
   * @param letters - The letters to append
   */
  appendDroppedLetters(letters: string): void {
    this.droppedLetters += letters;
  }

  /**
   * Gets the dropped letters
   * @returns The dropped letters
   */
  getDroppedLetters(): string {
    return this.droppedLetters;
  }

  /**
   * Clears the dropped letters
   */
  clearDroppedLetters(): void {
    this.droppedLetters = '';
  }

  /**
   * Checks if this is a sound word puzzle
   * @returns boolean indicating if this is a sound word puzzle
   */
  isSoundWordPuzzle(): boolean {
    return this.getPuzzleType() === 'SoundWord';
  }

  /**
   * Updates the puzzle level
   * @param puzzleNumber - The new puzzle number
   */
  override updatePuzzleLevel(puzzleNumber: number): void {
    super.updatePuzzleLevel(puzzleNumber);
    this.clearDroppedLetters();
  }
}
