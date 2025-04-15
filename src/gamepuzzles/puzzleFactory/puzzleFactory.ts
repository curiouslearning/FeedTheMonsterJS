import BasePuzzleLogic from '../basePuzzleLogic/basePuzzleLogic';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';
import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';
import SoundWordPuzzleLogic from '../soundWordPuzzleLogic/soundWordPuzzleLogic';

/**
 * Factory class to create the appropriate puzzle logic based on level type
 */
export default class PuzzleFactory {
  /**
   * Creates a puzzle logic instance based on the level type
   * @param levelData - The level data
   * @param puzzleNumber - The puzzle number
   * @returns The appropriate puzzle logic instance
   */
  static createPuzzleLogic(levelData: any, puzzleNumber: number): BasePuzzleLogic {
    const levelType = levelData?.levelMeta?.levelType;

    switch (levelType) {
      case 'Word':
        return new WordPuzzleLogic(levelData, puzzleNumber);
      case 'LetterOnly':
      case 'LetterInWord':
        return new LetterPuzzleLogic(levelData, puzzleNumber);
      case 'SoundWord':
        return new SoundWordPuzzleLogic(levelData, puzzleNumber);
      default:
        // Default to WordPuzzleLogic if level type is unknown
        console.warn(`Unknown level type: ${levelType}. Defaulting to WordPuzzleLogic.`);
        return new WordPuzzleLogic(levelData, puzzleNumber);
    }
  }
}
