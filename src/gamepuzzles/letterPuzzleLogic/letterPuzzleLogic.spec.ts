import LetterPuzzleLogic from './letterPuzzleLogic';

// Mock FeedbackAudioHandler and FeedbackType
jest.mock('@gamepuzzles/feedbackAudioHandler/feedbackAudioHandler', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      playFeedback: jest.fn()
    })),
    FeedbackType: {
      CORRECT_ANSWER: 'CORRECT_ANSWER',
      PARTIAL_CORRECT: 'PARTIAL_CORRECT',
      INCORRECT: 'INCORRECT',
    },
  };
});

describe('LetterPuzzleLogic', () => {
  let logic: LetterPuzzleLogic;
  const mockFeedBackTexts = { 0: 'Great!', 1: 'Nice!' };
  const mockAudioPlayer = { play: jest.fn(), stopFeedbackAudio: jest.fn() };
  const mockStoneHandler = {
    correctTargetStone: 'A',
    foilStones: [
      { x: 10, y: 10, text: 'A', origx: 10, origy: 10 },
      { x: 100, y: 100, text: 'B', origx: 100, origy: 100 },
    ],
    getCorrectTargetStone: jest.fn(() => 'A'),
    processLetterDropFeedbackAudio: jest.fn(),
  };

  beforeEach(() => {
    logic = new LetterPuzzleLogic(mockFeedBackTexts, mockStoneHandler as any);
    jest.clearAllMocks();
  });

  it('should instantiate with correct initial state', () => {
    expect(logic).toBeDefined();
    expect(logic.isFeedBackTriggered).toBe(false);
  });

  it('should set picked stone', () => {
    logic.setPickedStone('stone' as any);
    // @ts-ignore
    expect(logic.pickedStone).toBe('stone');
  });

  it('should get random feedback text', () => {
    expect(['Great!', 'Nice!']).toContain(logic.getRandomFeedBackText(0));
    expect(['Great!', 'Nice!']).toContain(logic.getRandomFeedBackText(1));
  });

  it('should get random int in range', () => {
    for (let i = 0; i < 10; i++) {
      const val = logic.getRandomInt(0, 1);
      expect(val === 0 || val === 1).toBe(true);
    }
  });

  it('should check stone dropped correctly (correct)', () => {
    const spy = jest.spyOn(mockStoneHandler, 'processLetterDropFeedbackAudio');
    const result = logic.checkStoneDropped('A', 'A', 0);
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledWith(0, true, false, 'A');
  });

  it('should check stone dropped correctly (incorrect)', () => {
    const spy = jest.spyOn(mockStoneHandler, 'processLetterDropFeedbackAudio');
    const result = logic.checkStoneDropped('B', 'A', 1);
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(1, false, false, 'B');
  });

  it('should handle letterPuzzle (correct)', () => {
    logic.setPickedStone({ frame: 100 } as any);
    const res = logic.letterPuzzle('A', 'A', 100);
    expect(res.isCorrect).toBe(true);
    expect(res.feedbackText).toBeDefined();
    expect(logic.isFeedBackTriggered).toBe(true);
    expect(logic.getScore()).toBe(100);
  });

  it('should handle letterPuzzle (incorrect)', () => {
    logic.setPickedStone({ frame: 100 } as any);
    const res = logic.letterPuzzle('B', 'A', 100);
    expect(res.isCorrect).toBe(false);
    expect(res.feedbackText).toBeDefined();
    expect(logic.isFeedBackTriggered).toBe(true);
    expect(logic.getScore()).toBe(0);
  });

  it('should delegate feedback audio to stoneHandler (correct answer)', () => {
    const spy = jest.spyOn(mockStoneHandler, 'processLetterDropFeedbackAudio');
    logic.checkStoneDropped('A', 'A', 0);
    expect(spy).toHaveBeenCalledWith(0, true, false, 'A');
  });

  it('should delegate feedback audio to stoneHandler (incorrect)', () => {
    const spy = jest.spyOn(mockStoneHandler, 'processLetterDropFeedbackAudio');
    logic.checkStoneDropped('B', 'A', 1);
    expect(spy).toHaveBeenCalledWith(1, false, false, 'B');
  });

  it('should reset feedback trigger', () => {
    logic.isFeedBackTriggered = true;
    logic.resetFeedbackTrigger();
    expect(logic.isFeedBackTriggered).toBe(false);
  });

  it('should get score', () => {
    logic.letterPuzzle('A', 'A', 100);
    expect(logic.getScore()).toBe(100);
  });
});
