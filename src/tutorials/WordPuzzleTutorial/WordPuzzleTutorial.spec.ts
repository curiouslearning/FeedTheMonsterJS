import WordPuzzleTutorial from './WordPuzzleTutorial';
import gameStateService from '@gameStateService';

describe('WordPuzzleTutorial.getNextLetterIndex', () => {
  const context = {} as CanvasRenderingContext2D;
  const stoneImg = {} as CanvasImageSource;

  const stonePositions = [
    { text: 'A' },
    { text: 'P' },
    { text: 'P' },
    { text: 'L' },
    { text: 'E' }
  ] as any;

  let tutorial: WordPuzzleTutorial;

  beforeEach(() => {
    // Mock getHitBoxRanges so updateTargetStonePositions in constructor doesn't crash
    jest.spyOn(gameStateService, 'getHitBoxRanges').mockReturnValue({
      hitboxRangeX: { from: 100, to: 200 },
      hitboxRangeY: { from: 300, to: 400 }
    });

    tutorial = new WordPuzzleTutorial({
      context,
      width: 1080,
      height: 1920,
      stoneImg,
      stonePositions,
      targetText: 'APPLE'
    });
  });

  it('returns first letter index when droppedHistory is empty', () => {
    const index = (tutorial as any).getNextLetterIndex(
      'APPLE',
      stonePositions,
      {}
    );

    expect(index).toBe(0);
  });

  it('returns second P when one P is already dropped', () => {
    const index = (tutorial as any).getNextLetterIndex(
      'APPLE',
      stonePositions,
      { 1: 'P' }
    );

    expect(index).toBe(2);
  });

  it('returns last letter when previous letters are dropped', () => {
    const index = (tutorial as any).getNextLetterIndex(
      'APPLE',
      stonePositions,
      {
        0: 'A',
        1: 'P',
        2: 'P',
        3: 'L'
      }
    );

    expect(index).toBe(4);
  });
});
