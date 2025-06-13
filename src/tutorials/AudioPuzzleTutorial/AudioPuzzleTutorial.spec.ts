import AudioPuzzleTutorial from './AudioPuzzleTutorial';
import TutorialComponent from '../base-tutorial/base-tutorial-component';

const mockAnimateImagePosVal = {
  x: 10,
  y: 20,
  dx: 1,
  dy: 1,
  absdx: 1,
  absdy: 1
};

const mockStonePosDetails = {
  animateImagePosVal: mockAnimateImagePosVal,
  startX: 0,
  startY: 0,
  endX: 50,
  endY: 50,
  monsterStoneDifference: 100
};

describe('MatchLetterPuzzleTutorial', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {};

    // Mock base method used in constructor
    jest.spyOn(TutorialComponent.prototype, 'updateTargetStonePositions')
      .mockReturnValue(mockStonePosDetails);

    // Control animation time for consistent testing
    jest.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize tutorial properties correctly from constructor input', () => {
    const width = 800;
    const height = 600;
    const stoneImg = { src: 'fakeImage' };
    const stonePosVal = [1, 2, 3];

    const tutorial = new AudioPuzzleTutorial({
      context: mockContext,
      width,
      height,
      stoneImg,
      stonePosVal
    });

    expect(tutorial.width).toBe(width);
    expect(tutorial.height).toBe(height);
    expect(tutorial.stoneImg).toBe(stoneImg);
    expect(tutorial.stonePosDetailsType).toEqual(mockStonePosDetails);
    expect(tutorial.x).toBe(mockAnimateImagePosVal.x);
    expect(tutorial.y).toBe(mockAnimateImagePosVal.y);
  });
});
