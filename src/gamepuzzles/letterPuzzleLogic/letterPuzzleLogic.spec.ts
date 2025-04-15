import LetterPuzzleLogic from './letterPuzzleLogic';

describe('LetterPuzzleLogic', () => {
  let letterPuzzleLogic: LetterPuzzleLogic;
  
  // Mock level data for LetterOnly puzzle
  const mockLetterOnlyData = {
    levelNumber: 1,
    levelMeta: {
      letterGroup: 1,
      levelNumber: 1,
      levelType: 'LetterOnly',
      promptFadeOut: 1,
      protoType: 'test'
    },
    puzzles: [
      {
        foilStones: ['a', 'b', 'c', 'd', 'e'],
        prompt: {
          promptAudio: 'audio.mp3',
          promptText: 'a'
        },
        segmentNumber: 1,
        targetStones: ['a']
      }
    ]
  };

  // Mock level data for LetterInWord puzzle
  const mockLetterInWordData = {
    levelNumber: 1,
    levelMeta: {
      letterGroup: 1,
      levelNumber: 1,
      levelType: 'LetterInWord',
      promptFadeOut: 1,
      protoType: 'test'
    },
    puzzles: [
      {
        foilStones: ['c', 'a', 't', 'd', 'o', 'g'],
        prompt: {
          promptAudio: 'audio.mp3',
          promptText: 'c'
        },
        segmentNumber: 1,
        targetStones: ['c']
      }
    ]
  };

  describe('LetterOnly puzzle', () => {
    beforeEach(() => {
      letterPuzzleLogic = new LetterPuzzleLogic(mockLetterOnlyData, 0);
    });

    test('should correctly identify as a letter puzzle', () => {
      expect(letterPuzzleLogic.isLetterPuzzle()).toBe(true);
      expect(letterPuzzleLogic.checkIsWordPuzzle()).toBe(false);
    });

    test('should correctly get the target letter', () => {
      expect(letterPuzzleLogic.getCorrectTargetStone()).toBe('a');
    });

    test('should correctly check if letter drop is correct', () => {
      expect(letterPuzzleLogic.isLetterDropCorrect('a')).toBe(true);
      expect(letterPuzzleLogic.isLetterDropCorrect('b')).toBe(false);
    });

    test('should set and get current letter correctly', () => {
      letterPuzzleLogic.setCurrentLetter('a');
      expect(letterPuzzleLogic.getCurrentLetter()).toBe('a');
    });

    test('should clear current letter correctly', () => {
      letterPuzzleLogic.setCurrentLetter('a');
      letterPuzzleLogic.clearCurrentLetter();
      expect(letterPuzzleLogic.getCurrentLetter()).toBe('');
    });

    test('should validate puzzle completion correctly', () => {
      letterPuzzleLogic.setCurrentLetter('a');
      expect(letterPuzzleLogic.validatePuzzleCompletion()).toBe(true);
      
      letterPuzzleLogic.setCurrentLetter('b');
      expect(letterPuzzleLogic.validatePuzzleCompletion()).toBe(false);
    });

    test('should update puzzle level and clear current letter', () => {
      letterPuzzleLogic.setCurrentLetter('a');
      letterPuzzleLogic.updatePuzzleLevel(1);
      expect(letterPuzzleLogic.getCurrentLetter()).toBe('');
      expect(letterPuzzleLogic['puzzleNumber']).toBe(1);
    });
  });

  describe('LetterInWord puzzle', () => {
    beforeEach(() => {
      letterPuzzleLogic = new LetterPuzzleLogic(mockLetterInWordData, 0);
    });

    test('should correctly identify as a letter puzzle', () => {
      expect(letterPuzzleLogic.isLetterPuzzle()).toBe(true);
      expect(letterPuzzleLogic.checkIsWordPuzzle()).toBe(false);
    });

    test('should correctly get the target letter', () => {
      expect(letterPuzzleLogic.getCorrectTargetStone()).toBe('c');
    });

    test('should correctly check if letter drop is correct', () => {
      expect(letterPuzzleLogic.isLetterDropCorrect('c')).toBe(true);
      expect(letterPuzzleLogic.isLetterDropCorrect('a')).toBe(false);
    });
  });
});
