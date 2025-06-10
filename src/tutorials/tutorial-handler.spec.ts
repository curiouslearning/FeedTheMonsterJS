import TutorialHandler from './index';
import QuickStartTutorial from './QuickStartTutorial/QuickStartTutorial';
import MatchLetterPuzzleTutorial from './MatchLetterPuzzleTutorial/MatchLetterPuzzleTutorial';
import gameStateService from '@gameStateService';

jest.mock('./QuickStartTutorial/QuickStartTutorial');
jest.mock('./MatchLetterPuzzleTutorial/MatchLetterPuzzleTutorial');
jest.mock('@gameStateService', () => ({
  EVENTS: {
    CORRECT_STONE_POSITION: 'correctStone',
    GAME_PAUSE_STATUS_EVENT: 'pauseStatus'
  },
  subscribe: jest.fn(),
  getGameTypeList: jest.fn(() => ({
    LetterInWord: 0,
    LetterOnly: 1,
    SoundLetterOnly: 2,
    Word: 3
  }))
}));

describe('TutorialHandler', () => {
  const mockContext = {} as CanvasRenderingContext2D;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize and subscribe to events if puzzleLevel is 0 and shouldHaveTutorial is true', () => {
    const handler = new TutorialHandler({
      context: mockContext,
      width: 800,
      height: 600,
      puzzleLevel: 0,
      shouldHaveTutorial: true // <-- Important
    });

    expect(gameStateService.subscribe).toHaveBeenCalledTimes(3);
    expect(gameStateService.getGameTypeList).toHaveBeenCalled();
  });

  it('should not subscribe if puzzleLevel is not 0', () => {
    const handler = new TutorialHandler({
      context: mockContext,
      width: 800,
      height: 600,
      puzzleLevel: 2
    });

    expect(gameStateService.subscribe).not.toHaveBeenCalled();
  });

  it('should hide tutorial and increment puzzleLevel', () => {
    const handler = new TutorialHandler({
      context: mockContext,
      width: 800,
      height: 600,
      puzzleLevel: 0
    });

    (handler as any).activeTutorial = {} as MatchLetterPuzzleTutorial;
    handler.hideTutorial();

    expect((handler as any).activeTutorial).toBeNull();
    expect((handler as any).puzzleLevel).toBe(1);
  });

  it('should draw quick start if game hasn’t started', () => {
    const handler = new TutorialHandler({
      context: mockContext,
      width: 800,
      height: 600,
      puzzleLevel: 0
    });

    const quickTutorialInstance = {
      quickStartTutorial: jest.fn()
    };
    (handler as any).quickTutorial = quickTutorialInstance;

    handler.drawQuickStart(0.16, false);

    expect(quickTutorialInstance.quickStartTutorial).toHaveBeenCalled();
  });

  it('should draw active tutorial if game has started and not paused', () => {
    const drawMock = jest.fn();
    const handler = new TutorialHandler({
      context: mockContext,
      width: 800,
      height: 600,
      puzzleLevel: 0
    });

    (handler as any).activeTutorial = {
      drawTutorial: drawMock
    };
    (handler as any).isGameOnPause = false;
    (handler as any).hasGameEnded = false;

    handler.draw(0.16, true);

    expect(drawMock).toHaveBeenCalledWith(0.16);
  });
});
