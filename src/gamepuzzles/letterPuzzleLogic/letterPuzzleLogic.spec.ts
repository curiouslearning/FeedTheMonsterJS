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
  };

  beforeEach(() => {
    logic = new LetterPuzzleLogic(mockFeedBackTexts, mockAudioPlayer as any, mockStoneHandler as any);
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
    const spy = jest.spyOn(logic as any, 'processLetterDropFeedbackAudio');
    const result = logic.checkStoneDropped('A', 0);
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledWith(0, true, false, 'A');
  });

  it('should check stone dropped correctly (incorrect)', () => {
    const spy = jest.spyOn(logic as any, 'processLetterDropFeedbackAudio');
    const result = logic.checkStoneDropped('B', 1);
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(1, false, false, 'B');
  });

  it('should handle letterPuzzle (correct)', () => {
    logic.setPickedStone({ frame: 100 } as any);
    const res = logic.letterPuzzle('A');
    expect(res.isCorrect).toBe(true);
    expect(res.feedbackText).toBeDefined();
    expect(logic.isFeedBackTriggered).toBe(true);
    expect(logic.getScore()).toBe(100);
  });

  it('should handle letterPuzzle (incorrect)', () => {
    logic.setPickedStone({ frame: 100 } as any);
    const res = logic.letterPuzzle('B');
    expect(res.isCorrect).toBe(false);
    expect(res.feedbackText).toBeDefined();
    expect(logic.isFeedBackTriggered).toBe(true);
    expect(logic.getScore()).toBe(0);
  });

  it('should block letterPuzzle if pickedStone is animating', () => {
    logic.setPickedStone({ frame: 50 } as any);
    const res = logic.letterPuzzle('A');
    expect(res).toEqual({ isCorrect: false, feedbackIndex: null, feedbackText: null });
  });

  it('should handle handlePickStoneUp (found)', () => {
    const stone = logic.handlePickStoneUp(10, 10);
    expect(stone).toBeDefined();
    expect(stone.foilStoneIndex).toBe(0);
  });

  it('should handle handlePickStoneUp (not found)', () => {
    const stone = logic.handlePickStoneUp(999, 999);
    expect(stone).toBeNull();
  });

  it('should compute cursor distance', () => {
    const d = logic.computeCursorDistance(0, 0, { x: 3, y: 4 });
    expect(d).toBe(5);
  });

  it('should reset stone position (short text, left)', () => {
    const stone = { text: 'A', x: 0, y: 0 };
    const stoneObj = { origx: 10, origy: 20 };
    const result = logic.resetStonePosition(100, stone as any, stoneObj as any);
    expect(result.x).toBe(35); // 10 + 25
    expect(result.y).toBe(20);
  });

  it('should reset stone position (default)', () => {
    const stone = { text: 'LONGTEXT', x: 0, y: 0 };
    const stoneObj = { origx: 100, origy: 200 };
    const result = logic.resetStonePosition(100, stone as any, stoneObj as any);
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });

  it('should processLetterDropFeedbackAudio (correct answer)', () => {
    const handler = (logic as any).feedbackAudioHandler;
    logic.processLetterDropFeedbackAudio(0, true, false, 'A');
    expect(handler.playFeedback).toHaveBeenCalledWith('CORRECT_ANSWER', 0);
  });

  it('should processLetterDropFeedbackAudio (incorrect)', () => {
    const handler = (logic as any).feedbackAudioHandler;
    logic.processLetterDropFeedbackAudio(1, false, false, 'B');
    expect(handler.playFeedback).toHaveBeenCalledWith('INCORRECT', 1);
  });

  it('should reset feedback trigger', () => {
    logic.isFeedBackTriggered = true;
    logic.resetFeedbackTrigger();
    expect(logic.isFeedBackTriggered).toBe(false);
  });

  it('should get score', () => {
    logic.letterPuzzle('A');
    expect(logic.getScore()).toBe(100);
  });
});
