import LetterPuzzleLogic from './letterPuzzleLogic';

describe('LetterPuzzleLogic', () => {
  let letterPuzzleLogic: LetterPuzzleLogic;
  let mockHandlers;

  beforeEach(() => {
    letterPuzzleLogic = new LetterPuzzleLogic();
    
    // Mock handlers and callbacks
    mockHandlers = {
      getRandomInt: jest.fn().mockReturnValue(0),
      handleCorrectLetterDrop: jest.fn(),
      handleLetterDropEnd: jest.fn(),
      isFeedBackTriggeredSetter: jest.fn(),
      playFeedbackAudio: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Validate correct letter drop
  it('should validate a correct letter drop', () => {
    // Arrange
    letterPuzzleLogic.setTargetLetter('A');
    
    // Act
    const result = letterPuzzleLogic.validateLetterDrop('A');
    
    // Assert
    expect(result).toBe(true);
  });

  // Test Case 2: Validate incorrect letter drop
  it('should invalidate an incorrect letter drop', () => {
    // Arrange
    letterPuzzleLogic.setTargetLetter('A');
    
    // Act
    const result = letterPuzzleLogic.validateLetterDrop('B');
    
    // Assert
    expect(result).toBe(false);
  });

  // Test Case 3: Handle letter drop with correct letter
  it('should handle a correct letter drop and trigger appropriate callbacks', () => {
    // Arrange
    letterPuzzleLogic.setTargetLetter('A');
    
    // Act
    const result = letterPuzzleLogic.handleLetterDrop({
      droppedText: 'A',
      ...mockHandlers
    });
    
    // Assert
    expect(result).toBe(true);
    expect(mockHandlers.playFeedbackAudio).toHaveBeenCalledWith(0, true, false, 'A');
    expect(mockHandlers.handleCorrectLetterDrop).toHaveBeenCalledWith(0);
    expect(mockHandlers.isFeedBackTriggeredSetter).toHaveBeenCalledWith(true);
    expect(mockHandlers.handleLetterDropEnd).toHaveBeenCalledWith(true, "Letter");
  });
});
