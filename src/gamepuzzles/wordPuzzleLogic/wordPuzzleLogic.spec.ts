import WordPuzzleLogic from './wordPuzzleLogic';

describe('WordPuzzleLogic', () => {
  let wordPuzzleLogic: WordPuzzleLogic;
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
        foilStones: ['c', 'a', 't', 'd', 'o', 'g'],
        prompt: {
          promptAudio: 'audio.mp3',
          promptText: 'cat'
        },
        segmentNumber: 1,
        targetStones: ['c', 'a', 't']
      }
    ]
  };

  beforeEach(() => {
    wordPuzzleLogic = new WordPuzzleLogic(mockLevelData, 0);
  });

  test('should initialize with empty values', () => {
    const values = wordPuzzleLogic.getValues();
    expect(values.groupedLetters).toBe('');
    expect(values.droppedLetters).toBe('');
    expect(values.groupedObj).toEqual({});
    expect(values.droppedHistory).toEqual({});
    expect(values.hideListObj).toEqual({});
  });

  test('should correctly identify as a word puzzle', () => {
    expect(wordPuzzleLogic.checkIsWordPuzzle()).toBe(true);
  });

  test('should correctly get the target word', () => {
    expect(wordPuzzleLogic.getCorrectTargetStone()).toBe('cat');
  });

  test('should correctly check if letter drop is correct', () => {
    // For a single letter (isWord = false)
    expect(wordPuzzleLogic.isLetterDropCorrect('cat', false)).toBe(true);
    expect(wordPuzzleLogic.isLetterDropCorrect('dog', false)).toBe(false);

    // For a partial word (isWord = true)
    expect(wordPuzzleLogic.isLetterDropCorrect('c', true)).toBe(true);
    expect(wordPuzzleLogic.isLetterDropCorrect('ca', true)).toBe(true);
    expect(wordPuzzleLogic.isLetterDropCorrect('cat', true)).toBe(true);
    expect(wordPuzzleLogic.isLetterDropCorrect('d', true)).toBe(false);
  });

  test('should handle picking up letters correctly', () => {
    wordPuzzleLogic.setPickUpLetter('c', 0);
    
    let values = wordPuzzleLogic.getValues();
    expect(values.groupedLetters).toBe('c');
    expect(values.groupedObj[0]).toBe('c');
    
    wordPuzzleLogic.setPickUpLetter('a', 1);
    
    values = wordPuzzleLogic.getValues();
    expect(values.groupedLetters).toBe('ca');
    expect(values.groupedObj[1]).toBe('a');
  });

  test('should handle setting grouped letters to dropped correctly', () => {
    wordPuzzleLogic.setPickUpLetter('c', 0);
    wordPuzzleLogic.setPickUpLetter('a', 1);
    wordPuzzleLogic.setGroupToDropped();
    
    const values = wordPuzzleLogic.getValues();
    expect(values.droppedLetters).toBe('ca');
    expect(values.droppedHistory[0]).toBe('c');
    expect(values.droppedHistory[1]).toBe('a');
  });

  test('should validate fed letters correctly', () => {
    // Create a spy on the validateFedLetters method to see what's happening
    const validateFedLettersSpy = jest.spyOn(wordPuzzleLogic, 'validateFedLetters');
    
    // Set the first letter
    wordPuzzleLogic.setPickUpLetter('c', 0);
    wordPuzzleLogic.setGroupToDropped();
    
    // Check the droppedLetters value
    const values1 = wordPuzzleLogic.getValues();
    expect(values1.droppedLetters).toBe('c');
    expect(wordPuzzleLogic.validateFedLetters()).toBe(true);
    
    // Set the second letter
    wordPuzzleLogic.setPickUpLetter('a', 1);
    wordPuzzleLogic.setGroupToDropped();
    
    // Check the droppedLetters value
    const values2 = wordPuzzleLogic.getValues();
    expect(values2.droppedLetters).toBe('ca');
    expect(wordPuzzleLogic.validateFedLetters()).toBe(true);
    
    // Create a new instance with incorrect letters
    const newWordPuzzleLogic = new WordPuzzleLogic(mockLevelData, 0);
    newWordPuzzleLogic.setPickUpLetter('d', 3);
    newWordPuzzleLogic.setGroupToDropped();
    expect(newWordPuzzleLogic.validateFedLetters()).toBe(false);
  });

  test('should validate puzzle completion correctly', () => {
    // Set the first letter
    wordPuzzleLogic.setPickUpLetter('c', 0);
    wordPuzzleLogic.setGroupToDropped();
    
    // Check the droppedLetters value
    const values1 = wordPuzzleLogic.getValues();
    expect(values1.droppedLetters).toBe('c');
    expect(wordPuzzleLogic.validatePuzzleCompletion()).toBe(false);
    
    // Set the second letter
    wordPuzzleLogic.setPickUpLetter('a', 1);
    wordPuzzleLogic.setGroupToDropped();
    
    // Check the droppedLetters value
    const values2 = wordPuzzleLogic.getValues();
    expect(values2.droppedLetters).toBe('ca');
    expect(wordPuzzleLogic.validatePuzzleCompletion()).toBe(false);
    
    // Set the third letter
    wordPuzzleLogic.setPickUpLetter('t', 2);
    wordPuzzleLogic.setGroupToDropped();
    
    // Check the droppedLetters value
    const values3 = wordPuzzleLogic.getValues();
    expect(values3.droppedLetters).toBe('cat');
    expect(wordPuzzleLogic.validatePuzzleCompletion()).toBe(true);
  });

  test('should clear picked up letters correctly', () => {
    wordPuzzleLogic.setPickUpLetter('c', 0);
    wordPuzzleLogic.setPickUpLetter('a', 1);
    
    wordPuzzleLogic.clearPickedUp();
    
    const values = wordPuzzleLogic.getValues();
    expect(values.groupedLetters).toBe('');
    expect(values.groupedObj).toEqual({});
  });

  test('should validate if stone should be hidden correctly', () => {
    // Initially no stones should be hidden
    expect(wordPuzzleLogic.validateShouldHideLetter(0)).toBe(true);
    
    // After picking up a letter, it should be hidden
    wordPuzzleLogic.setPickUpLetter('c', 0);
    expect(wordPuzzleLogic.validateShouldHideLetter(0)).toBe(true);
    
    // After clearing picked up letters, the letter should still be hidden
    // because it's in the hideListObj
    wordPuzzleLogic.clearPickedUp();
    expect(wordPuzzleLogic.validateShouldHideLetter(0)).toBe(true);
  });
});
