import PuzzleHandler from './puzzleHandler';
import { FeedbackTextEffects } from '@components/feedback-text';
import { FeedbackType } from '@gamepuzzles';

jest.mock('../letterPuzzleLogic/letterPuzzleLogic');
jest.mock('../wordPuzzleLogic/wordPuzzleLogic');

describe('PuzzleHandler', () => {
  let puzzleHandler: PuzzleHandler;
  let mockLevelData: any;
  let mockContext: any;
  let mockFeedbackTextEffects: any;

  beforeEach(() => {
    // Mock level data for testing
    mockLevelData = {
      levelMeta: {
        levelType: 'LetterOnly'
      }
    };

    // Mock context for puzzle creation
    mockContext = {
      levelType: 'LetterOnly',
      pickedLetter: {
        text: 'A',
        frame: 1
      },
      targetLetterText: 'A',
      audioPlayer: {
        play: jest.fn()
      },
      promptText: {
        droppedLetterIndex: jest.fn()
      },
      feedBackTexts: {
        'feedback1': 'Great job!',
        'feedback2': 'Well done!'
      },
      handleCorrectLetterDrop: jest.fn(),
      handleLetterDropEnd: jest.fn(),
      triggerMonsterAnimation: jest.fn(),
      timerTicking: {
        startTimer: jest.fn()
      },
      isFeedBackTriggeredSetter: jest.fn(),
      lang: 'english',
      lettersCountRef: { value: 1 }
    };

    mockFeedbackTextEffects = {
      wrapText: jest.fn(),
      hideText: jest.fn()
    };

    // Create PuzzleHandler instance
    puzzleHandler = new PuzzleHandler(mockLevelData, 0);
    
    // Mock setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // Test Case 1: Initialize with different level types
  it('should initialize with the correct puzzle logic based on level type', () => {
    // Test LetterOnly level type
    const letterHandler = new PuzzleHandler({ levelMeta: { levelType: 'LetterOnly' } }, 0);
    expect(letterHandler['wordPuzzleLogic']).toBeNull();
    
    // Test Word level type
    const wordHandler = new PuzzleHandler({ levelMeta: { levelType: 'Word' } }, 0);
    expect(wordHandler['wordPuzzleLogic']).not.toBeNull();
  });

  // Test Case 2: Test handleCorrectLetterDrop method
  it('should handle correct letter drop with proper feedback and scoring', () => {
    // Mock the addScore function
    const mockAddScore = jest.fn();
    
    // Call the method
    puzzleHandler.handleCorrectLetterDrop(
      0,
      mockFeedbackTextEffects as any,
      mockContext,
      mockAddScore
    );
    
    // Verify the score was added
    expect(mockAddScore).toHaveBeenCalledWith(100);
    
    // Verify feedback text was displayed
    expect(mockFeedbackTextEffects.wrapText).toHaveBeenCalled();
    
    // Advance timers to verify feedback text is hidden after delay
    jest.advanceTimersByTime(4500);
    expect(mockFeedbackTextEffects.hideText).toHaveBeenCalled();
  });

  // Test Case 3: Test createPuzzle routing to correct handler
  it('should route to the correct puzzle handler based on level type', () => {
    // Spy on the private methods
    const letterPuzzleSpy = jest.spyOn(puzzleHandler as any, 'handleLetterPuzzle');
    const wordPuzzleSpy = jest.spyOn(puzzleHandler as any, 'handleWordPuzzle');
    
    // Test LetterOnly level type
    puzzleHandler.createPuzzle({
      ...mockContext,
      levelType: 'LetterOnly'
    });
    expect(letterPuzzleSpy).toHaveBeenCalled();
    expect(wordPuzzleSpy).not.toHaveBeenCalled();
    
    // Reset spies
    letterPuzzleSpy.mockClear();
    wordPuzzleSpy.mockClear();
    
    // Test Word level type
    puzzleHandler.createPuzzle({
      ...mockContext,
      levelType: 'Word'
    });
    expect(wordPuzzleSpy).toHaveBeenCalled();
    expect(letterPuzzleSpy).not.toHaveBeenCalled();
  });
});
