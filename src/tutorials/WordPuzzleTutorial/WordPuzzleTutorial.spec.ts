import WordPuzzleTutorial from './WordPuzzleTutorial';
import gameStateService from '@gameStateService';

describe('WordPuzzleTutorial', () => {
  let tutorial: WordPuzzleTutorial;
  const mockContext = {} as CanvasRenderingContext2D;
  const dummyStoneImg = new Image();
  const stonePositions = [[10, 10], [20, 20], [30, 30]];
  const levelData = {
    puzzles: [
      {
        targetStones: ['A', 'B', 'C'],
        foilStones: ['A', 'B', 'C']
      }
    ]
  };

  let capturedCallback: (count: number) => void;

  beforeEach(() => {
    // Mock the gameStateService.subscribe function
    jest.spyOn(gameStateService, 'subscribe').mockImplementation((event, cb) => {
      if (event === gameStateService.EVENTS.WORD_PUZZLE_SUBMITTED_LETTERS_COUNT) {
        capturedCallback = cb;
      }
      return jest.fn(); // return dummy unsubscribe
    });

    jest.spyOn(gameStateService, 'getHitBoxRanges').mockReturnValue({
      hitboxRangeX: { from: 100, to: 200 },
      hitboxRangeY: { from: 300, to: 400 }
    });

    tutorial = new WordPuzzleTutorial({
      context: mockContext,
      width: 300,
      height: 300,
      stoneImg: dummyStoneImg,
      stonePositions,
      levelData
    });

    jest.spyOn(tutorial as any, 'updateTargetStonePositions').mockReturnValue({
      animateImagePosVal: { x: 0, y: 0, dx: 1, dy: 1, absdx: 1, absdy: 1 },
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100,
      monsterStoneDifference: 100
    });
  });

  it('should reinitialize animation on WORD_PUZZLE_SUBMITTED_LETTERS_COUNT event', () => {
    const spy = jest.spyOn(tutorial as any, 'initializeStoneAnimation');

    // Simulate event trigger
    capturedCallback(4); // 4 % 3 = 1

    expect((tutorial as any).currentStoneIndex).toBe(1);
    expect(spy).toHaveBeenCalledWith(1);
  });
});
