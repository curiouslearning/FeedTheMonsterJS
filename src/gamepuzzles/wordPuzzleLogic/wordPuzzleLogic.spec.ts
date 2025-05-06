import WordPuzzleLogic from './wordPuzzleLogic';

describe('WordPuzzleLogic', () => {
  let wordPuzzleLogic: WordPuzzleLogic;
  let mockLevelData: any;

  beforeEach(() => {
    // Create mock level data for testing
    mockLevelData = {
      levelNumber: 1,
      levelMeta: {
        letterGroup: 3,
        levelNumber: 1,
        levelType: 'Word',
        promptFadeOut: 500,
        protoType: 'standard'
      },
      puzzles: [
        {
          foilLetters: ['C', 'A', 'T'],
          prompt: {
            promptAudio: 'audio/cat.mp3',
            promptText: 'CAT'
          },
          segmentNumber: 1,
          targetLetters: ['C', 'A', 'T']
        }
      ]
    };

    // Create a new WordPuzzleLogic instance for each test
    wordPuzzleLogic = new WordPuzzleLogic(mockLevelData, 0);
  });

  // Test Case 1: Test letter validation in word puzzles
  it('should correctly validate letters for word puzzles', () => {
    // Test with a completely fresh instance
    const freshWordPuzzleLogic = new WordPuzzleLogic(mockLevelData, 0);
    
    // For the first letter, we need to test differently
    // The first letter needs to match the start of the target word
    
    // First, let's add a letter to the group
    freshWordPuzzleLogic.setPickUpLetter('C', 0);
    
    // Now we can test adding a second letter
    expect(freshWordPuzzleLogic.handleCheckHoveredLetter('A', 1)).toBe(true);
    
    // Test that an incorrect letter is rejected
    expect(freshWordPuzzleLogic.handleCheckHoveredLetter('Z', 2)).toBe(false);
    
    // Add the second letter
    freshWordPuzzleLogic.setPickUpLetter('A', 1);
    
    // Test that the third letter is accepted
    expect(freshWordPuzzleLogic.handleCheckHoveredLetter('T', 2)).toBe(true);
    
    // Test that a duplicate letter is rejected
    expect(freshWordPuzzleLogic.handleCheckHoveredLetter('A', 3)).toBe(false);
  });

  // Test Case 2: Validate word puzzle completion
  it('should validate if the word puzzle is complete', () => {
    // Initially the puzzle is not complete
    expect(wordPuzzleLogic.validateWordPuzzle()).toBe(false);
    
    // Add letters to the group
    wordPuzzleLogic.setPickUpLetter('C', 0);
    wordPuzzleLogic.setPickUpLetter('A', 1);
    wordPuzzleLogic.setPickUpLetter('T', 2);
    
    // Move grouped letters to dropped
    wordPuzzleLogic.setGroupToDropped();
    
    // Now the puzzle should be complete
    expect(wordPuzzleLogic.validateWordPuzzle()).toBe(true);
  });

  // Test Case 3: Test state management
  it('should correctly manage state for grouped and dropped letters', () => {
    // Initial state should be empty
    const initialState = wordPuzzleLogic.getValues();
    expect(initialState.groupedLetters).toBe('');
    expect(initialState.droppedLetters).toBe('');
    expect(Object.keys(initialState.groupedObj).length).toBe(0);
    
    // Add a letter to the group
    wordPuzzleLogic.setPickUpLetter('C', 0);
    
    // Check updated state
    const afterPickupState = wordPuzzleLogic.getValues();
    expect(afterPickupState.groupedLetters).toBe('C');
    expect(Object.keys(afterPickupState.groupedObj).length).toBe(1);
    expect(afterPickupState.groupedObj[0]).toBe('C');
    
    // Move grouped letters to dropped
    wordPuzzleLogic.setGroupToDropped();
    
    // Check state after dropping
    const afterDropState = wordPuzzleLogic.getValues();
    expect(afterDropState.groupedLetters).toBe('C');
    expect(afterDropState.droppedLetters).toBe('C');
    expect(Object.keys(afterDropState.droppedHistory).length).toBe(1);
    
    // Clear picked up letters
    wordPuzzleLogic.clearPickedUp();
    
    // Check state after clearing
    const afterClearState = wordPuzzleLogic.getValues();
    expect(afterClearState.groupedLetters).toBe('');
    expect(afterClearState.droppedLetters).toBe('C');
    expect(Object.keys(afterClearState.groupedObj).length).toBe(0);
  });
});
