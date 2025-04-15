import BasePuzzleLogic from './basePuzzleLogic';

// Create a concrete implementation of BasePuzzleLogic for testing
class TestPuzzleLogic extends BasePuzzleLogic {
  isLetterDropCorrect(droppedStone: string, isWord?: boolean): boolean {
    return droppedStone === this.getCorrectTargetStone();
  }

  getCorrectTargetStone(): string {
    return this.getTargetText();
  }

  validatePuzzleCompletion(): boolean {
    return true;
  }
}

describe('BasePuzzleLogic', () => {
  let puzzleLogic: TestPuzzleLogic;
  const mockLevelData = {
    levelNumber: 1,
    levelMeta: {
      letterGroup: 1,
      levelNumber: 1,
      levelType: 'Word',
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
    puzzleLogic = new TestPuzzleLogic(mockLevelData, 0);
  });

  test('should correctly initialize with level data and puzzle number', () => {
    expect(puzzleLogic['levelData']).toEqual(mockLevelData);
    expect(puzzleLogic['puzzleNumber']).toBe(0);
  });

  test('should update puzzle level correctly', () => {
    puzzleLogic.updatePuzzleLevel(1);
    expect(puzzleLogic['puzzleNumber']).toBe(1);
  });

  test('should get puzzle type correctly', () => {
    expect(puzzleLogic.getPuzzleType()).toBe('Word');
  });

  test('should check if puzzle is a word puzzle correctly', () => {
    expect(puzzleLogic.checkIsWordPuzzle()).toBe(true);
    
    // Change level type and test again
    const newMockLevelData = { ...mockLevelData };
    newMockLevelData.levelMeta.levelType = 'LetterOnly';
    const newPuzzleLogic = new TestPuzzleLogic(newMockLevelData, 0);
    expect(newPuzzleLogic.checkIsWordPuzzle()).toBe(false);
  });

  test('should get default values correctly', () => {
    const values = puzzleLogic.getValues();
    expect(values).toEqual({
      groupedLetters: '',
      droppedLetters: '',
      groupedObj: {},
      droppedHistory: {},
      hideListObj: {}
    });
  });

  test('should validate if stone letter should be hidden correctly', () => {
    expect(puzzleLogic.validateShouldHideLetter(0)).toBe(true);
  });

  test('should handle check hovered stone correctly', () => {
    expect(puzzleLogic.handleCheckHoveredStone('a', 0)).toBe(false);
  });

  test('should validate fed letters correctly', () => {
    expect(puzzleLogic.validateFedLetters()).toBe(false);
  });

  test('should validate word puzzle correctly', () => {
    expect(puzzleLogic.validateWordPuzzle()).toBe(true);
  });

  test('should get correct target stone correctly', () => {
    expect(puzzleLogic.getCorrectTargetStone()).toBe('abc');
  });

  test('should check if letter drop is correct', () => {
    expect(puzzleLogic.isLetterDropCorrect('abc')).toBe(true);
    expect(puzzleLogic.isLetterDropCorrect('def')).toBe(false);
  });
});
