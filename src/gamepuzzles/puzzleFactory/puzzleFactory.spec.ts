import PuzzleFactory from './puzzleFactory';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';
import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';
import SoundWordPuzzleLogic from '../soundWordPuzzleLogic/soundWordPuzzleLogic';

// Mock the console.warn to avoid polluting test output
console.warn = jest.fn();

describe('PuzzleFactory', () => {
  const mockLevelData = {
    levelNumber: 1,
    levelMeta: {
      letterGroup: 1,
      levelNumber: 1,
      levelType: '', // Will be set in each test
      promptFadeOut: 1,
      protoType: 'test'
    },
    puzzles: [
      {
        foilStones: ['a', 'b', 'c'],
        prompt: {
          promptAudio: 'audio.mp3',
          promptText: 'abc'
        },
        segmentNumber: 1,
        targetStones: ['a', 'b', 'c']
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create WordPuzzleLogic for Word level type', () => {
    const levelData = { ...mockLevelData };
    levelData.levelMeta.levelType = 'Word';
    
    const puzzleLogic = PuzzleFactory.createPuzzleLogic(levelData, 0);
    
    expect(puzzleLogic).toBeInstanceOf(WordPuzzleLogic);
  });

  test('should create LetterPuzzleLogic for LetterOnly level type', () => {
    const levelData = { ...mockLevelData };
    levelData.levelMeta.levelType = 'LetterOnly';
    
    const puzzleLogic = PuzzleFactory.createPuzzleLogic(levelData, 0);
    
    expect(puzzleLogic).toBeInstanceOf(LetterPuzzleLogic);
  });

  test('should create LetterPuzzleLogic for LetterInWord level type', () => {
    const levelData = { ...mockLevelData };
    levelData.levelMeta.levelType = 'LetterInWord';
    
    const puzzleLogic = PuzzleFactory.createPuzzleLogic(levelData, 0);
    
    expect(puzzleLogic).toBeInstanceOf(LetterPuzzleLogic);
  });

  test('should create SoundWordPuzzleLogic for SoundWord level type', () => {
    const levelData = { ...mockLevelData };
    levelData.levelMeta.levelType = 'SoundWord';
    
    const puzzleLogic = PuzzleFactory.createPuzzleLogic(levelData, 0);
    
    expect(puzzleLogic).toBeInstanceOf(SoundWordPuzzleLogic);
  });

  test('should default to WordPuzzleLogic for unknown level type', () => {
    const levelData = { ...mockLevelData };
    levelData.levelMeta.levelType = 'UnknownType';
    
    const puzzleLogic = PuzzleFactory.createPuzzleLogic(levelData, 0);
    
    expect(puzzleLogic).toBeInstanceOf(WordPuzzleLogic);
    expect(console.warn).toHaveBeenCalledWith('Unknown level type: UnknownType. Defaulting to WordPuzzleLogic.');
  });

  test('should handle null or undefined level data gracefully', () => {
    // Test with null level data
    const puzzleLogic1 = PuzzleFactory.createPuzzleLogic(null, 0);
    expect(puzzleLogic1).toBeInstanceOf(WordPuzzleLogic);
    
    // Test with undefined level type
    const levelData = { ...mockLevelData };
    levelData.levelMeta.levelType = undefined;
    const puzzleLogic2 = PuzzleFactory.createPuzzleLogic(levelData, 0);
    expect(puzzleLogic2).toBeInstanceOf(WordPuzzleLogic);
  });
});
