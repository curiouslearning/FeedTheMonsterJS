import SoundWordPuzzleLogic from './soundWordPuzzleLogic';

describe('SoundWordPuzzleLogic', () => {
  let soundWordPuzzleLogic: SoundWordPuzzleLogic;
  const mockLevelData = {
    levelNumber: 1,
    levelMeta: {
      letterGroup: 1,
      levelNumber: 1,
      levelType: 'SoundWord',
      promptFadeOut: 1,
      protoType: 'test'
    },
    puzzles: [
      {
        foilStones: ['d', 'o', 'g', 'c', 'a', 't'],
        prompt: {
          promptAudio: 'audio.mp3',
          promptText: 'dog'
        },
        segmentNumber: 1,
        targetStones: ['d', 'o', 'g']
      }
    ]
  };

  beforeEach(() => {
    soundWordPuzzleLogic = new SoundWordPuzzleLogic(mockLevelData, 0);
  });

  test('should correctly identify as a sound word puzzle', () => {
    expect(soundWordPuzzleLogic.isSoundWordPuzzle()).toBe(true);
    expect(soundWordPuzzleLogic.checkIsWordPuzzle()).toBe(false);
  });

  test('should correctly get the target word', () => {
    expect(soundWordPuzzleLogic.getCorrectTargetStone()).toBe('dog');
  });

  test('should correctly check if letter drop is correct', () => {
    // For partial words
    expect(soundWordPuzzleLogic.isLetterDropCorrect('d')).toBe(true);
    expect(soundWordPuzzleLogic.isLetterDropCorrect('do')).toBe(true);
    expect(soundWordPuzzleLogic.isLetterDropCorrect('dog')).toBe(true);
    
    // For incorrect words
    expect(soundWordPuzzleLogic.isLetterDropCorrect('c')).toBe(false);
    expect(soundWordPuzzleLogic.isLetterDropCorrect('cat')).toBe(false);
  });

  test('should set and get dropped letters correctly', () => {
    soundWordPuzzleLogic.setDroppedLetters('d');
    expect(soundWordPuzzleLogic.getDroppedLetters()).toBe('d');
    
    soundWordPuzzleLogic.setDroppedLetters('dog');
    expect(soundWordPuzzleLogic.getDroppedLetters()).toBe('dog');
  });

  test('should append dropped letters correctly', () => {
    soundWordPuzzleLogic.setDroppedLetters('d');
    soundWordPuzzleLogic.appendDroppedLetters('o');
    expect(soundWordPuzzleLogic.getDroppedLetters()).toBe('do');
    
    soundWordPuzzleLogic.appendDroppedLetters('g');
    expect(soundWordPuzzleLogic.getDroppedLetters()).toBe('dog');
  });

  test('should clear dropped letters correctly', () => {
    soundWordPuzzleLogic.setDroppedLetters('dog');
    soundWordPuzzleLogic.clearDroppedLetters();
    expect(soundWordPuzzleLogic.getDroppedLetters()).toBe('');
  });

  test('should validate puzzle completion correctly', () => {
    soundWordPuzzleLogic.setDroppedLetters('d');
    expect(soundWordPuzzleLogic.validatePuzzleCompletion()).toBe(false);
    
    soundWordPuzzleLogic.setDroppedLetters('do');
    expect(soundWordPuzzleLogic.validatePuzzleCompletion()).toBe(false);
    
    soundWordPuzzleLogic.setDroppedLetters('dog');
    expect(soundWordPuzzleLogic.validatePuzzleCompletion()).toBe(true);
  });

  test('should update puzzle level and clear dropped letters', () => {
    soundWordPuzzleLogic.setDroppedLetters('dog');
    soundWordPuzzleLogic.updatePuzzleLevel(1);
    expect(soundWordPuzzleLogic.getDroppedLetters()).toBe('');
    expect(soundWordPuzzleLogic['puzzleNumber']).toBe(1);
  });
});
