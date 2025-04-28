import LetterPuzzleLogic from './letterPuzzleLogic';

describe('LetterPuzzleLogic', () => {
  let logic: LetterPuzzleLogic;
  const mockFeedBackTexts = { 0: 'Great!', 1: 'Nice!' };
  const mockAudioPlayer = { play: jest.fn(), stopFeedbackAudio: jest.fn() };
  const mockStoneHandler = { correctTargetStone: 'A' };

  beforeEach(() => {
    logic = new LetterPuzzleLogic(mockFeedBackTexts, mockAudioPlayer as any, mockStoneHandler as any);
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

  it('should check stone dropped correctly', () => {
    const result = logic.checkStoneDropped('A', 0);
    expect(result).toBe(true);
  });
});
