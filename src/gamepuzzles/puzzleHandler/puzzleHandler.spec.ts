import PuzzleHandler from './puzzleHandler';
import { FeedbackTextEffects } from '@components/feedback-text';
import { FeedbackType } from '@gamepuzzles';
import WordPuzzleLogic from '../wordPuzzleLogic/wordPuzzleLogic';
import LetterPuzzleLogic from '../letterPuzzleLogic/letterPuzzleLogic';

jest.mock('../wordPuzzleLogic/wordPuzzleLogic');
jest.mock('../letterPuzzleLogic/letterPuzzleLogic');
jest.mock('@components/feedback-text');
jest.mock('@gamepuzzles', () => ({
  FeedbackAudioHandler: jest.fn().mockImplementation(() => ({
    playFeedback: jest.fn(),
    stopAllAudio: jest.fn(),
    dispose: jest.fn(),
  })),
  FeedbackType: {
    CORRECT_ANSWER: 'CORRECT_ANSWER',
    PARTIAL_CORRECT: 'PARTIAL_CORRECT',
    INCORRECT: 'INCORRECT',
  },
}));

describe('PuzzleHandler', () => {
  let handler: PuzzleHandler;
  let ctx: any;

  beforeEach(() => {
    jest.clearAllMocks();

    (LetterPuzzleLogic as jest.Mock).mockImplementation(() => ({
      setTargetLetter: jest.fn(),
      validateLetterDrop: jest.fn().mockReturnValue(true),
    }));

    (WordPuzzleLogic as jest.Mock).mockImplementation(() => ({
      validateFedLetters: jest.fn().mockReturnValue(true),
      validateWordPuzzle: jest.fn().mockReturnValue(true),
      setGroupToDropped: jest.fn(),
      getValues: jest.fn().mockReturnValue({
        droppedLetters: 'WORD',
        groupedObj: {},
        droppedHistory: { A: true, B: true },
      }),
      clearPickedUp: jest.fn(),
    }));

    (FeedbackTextEffects as jest.Mock).mockImplementation(() => ({
      wrapText: jest.fn(),
      hideText: jest.fn(),
    }));

    ctx = {
      levelType: 'LetterOnly',
      pickedLetter: { text: 'A', frame: 0 },
      targetLetterText: 'A',
      feedBackTexts: { 0: 'Nice!', 1: 'Great job!' },
      handleLetterDropEnd: jest.fn(),
      triggerMonsterAnimation: jest.fn(),
      timerTicking: { startTimer: jest.fn() },
      lang: 'english',
      lettersCountRef: { value: 0 }
    };

    handler = new PuzzleHandler({ levelMeta: { levelType: 'LetterOnly' } }, 0, {});
  });

  describe('handleLetterPuzzle', () => {
    it('should validate letter drop, play correct audio and call feedback', () => {
      handler.createPuzzle(ctx);

      const mockAudio = (handler as any).feedbackAudioHandler;
      expect(mockAudio.playFeedback).toHaveBeenCalledWith(FeedbackType.CORRECT_ANSWER, expect.any(Number));
      expect(ctx.handleLetterDropEnd).toHaveBeenCalledWith(true, 'Letter');
    });

    it('should skip feedback text if incorrect', () => {
      (LetterPuzzleLogic as jest.Mock).mockImplementation(() => ({
        setTargetLetter: jest.fn(),
        validateLetterDrop: jest.fn().mockReturnValue(false),
      }));

      const handlerIncorrect = new PuzzleHandler({ levelMeta: { levelType: 'LetterOnly' } }, 0, {});
      handlerIncorrect.createPuzzle(ctx);

      expect(ctx.handleLetterDropEnd).toHaveBeenCalledWith(false, 'Letter');
      expect(FeedbackTextEffects.prototype.wrapText).not.toHaveBeenCalled();
    });
  });

  describe('handleWordPuzzle', () => {
    beforeEach(() => {
      handler = new PuzzleHandler({ levelMeta: { levelType: 'Word' } }, 0, {});
      ctx.levelType = 'Word';
    });

    it('should process correct word drop and complete word', () => {
      handler.createPuzzle(ctx);

      expect(ctx.handleLetterDropEnd).toHaveBeenCalledWith(true, 'Word');
      expect(ctx.lettersCountRef.value).toBe(1);
    });

    it('should process partially correct word drop', () => {
      (WordPuzzleLogic as jest.Mock).mockImplementation(() => ({
        validateFedLetters: jest.fn().mockReturnValue(true),
        validateWordPuzzle: jest.fn().mockReturnValue(false),
        setGroupToDropped: jest.fn(),
        getValues: jest.fn().mockReturnValue({
          droppedHistory: { A: true },
          droppedLetters: 'W',
        }),
      }));

      handler = new PuzzleHandler({ levelMeta: { levelType: 'Word' } }, 0, {});
      handler.createPuzzle(ctx);

      expect(ctx.triggerMonsterAnimation).toHaveBeenCalledWith('isMouthClosed');
      expect(ctx.lettersCountRef.value).toBe(1);
    });

    it('should process incorrect word drop', () => {
      (WordPuzzleLogic as jest.Mock).mockImplementation(() => ({
        validateFedLetters: jest.fn().mockReturnValue(false),
        getValues: jest.fn().mockReturnValue({}),
        setGroupToDropped: jest.fn(),
      }));

      handler = new PuzzleHandler({ levelMeta: { levelType: 'Word' } }, 0, {});
      handler.createPuzzle(ctx);

      expect(ctx.handleLetterDropEnd).toHaveBeenCalledWith(false, 'Word');
      expect(ctx.lettersCountRef.value).toBe(1);
    });
  });

  describe('processLetterDropFeedbackAudio', () => {
    it('should play correct, partial, or incorrect audio', () => {
      const instance = handler as any;

      // simulate correct exact match
      instance.processLetterDropFeedbackAudio('A', 0, true, true, 'A');
      expect(instance.feedbackAudioHandler.playFeedback).toHaveBeenCalledWith(
        FeedbackType.CORRECT_ANSWER,
        0
      );

      // simulate partial match
      instance.processLetterDropFeedbackAudio('A', 1, true, true, 'B');
      expect(instance.feedbackAudioHandler.playFeedback).toHaveBeenCalledWith(
        FeedbackType.PARTIAL_CORRECT,
        1
      );

      // simulate incorrect
      instance.processLetterDropFeedbackAudio('A', 0, false, true, 'B');
      expect(instance.feedbackAudioHandler.playFeedback).toHaveBeenCalledWith(
        FeedbackType.INCORRECT,
        0
      );
    });
  });

  describe('utilities', () => {
    it('getRandomInt returns value in bounds', () => {
      const val = handler.getRandomInt(0, 1, ctx.feedBackTexts);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    });

    it('getRandomFeedBackText returns expected text', () => {
      const text = handler.getRandomFeedBackText(0, ctx.feedBackTexts);
      expect(text).toBe('Nice!');
    });
  });

  it('should dispose feedback audio handler', () => {
    const audioHandler = handler['feedbackAudioHandler'];
    handler.dispose();
    expect(audioHandler.dispose).toHaveBeenCalled();
  });
});
