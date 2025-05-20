import MatchLetterPuzzleTutorial from './MatchLetterPuzzleTutorial';
import gameStateService from '@gameStateService';
import TutorialComponent from '../base-tutorial/base-tutorial-component';

// Mocks
jest.mock('@gameStateService', () => ({
  EVENTS: {
    CORRECT_STONE_POSITION: 'CORRECT_STONE_POSITION'
  },
  subscribe: jest.fn()
}));

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
    (gameStateService.subscribe as jest.Mock).mockClear();

    // Force mock of the base method
    jest.spyOn(TutorialComponent.prototype, 'updateTargetStonePositions')
      .mockReturnValue(mockStonePosDetails);

    // Prevent animation logic from progressing
    jest.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should subscribe to the correct event and update properties when level is 0', () => {
    const width = 800;
    const height = 600;

    const tutorial = new MatchLetterPuzzleTutorial({
      context: mockContext,
      width,
      height,
      stoneImg: null,
      stonePosVal: []
    });

    expect(gameStateService.subscribe).toHaveBeenCalledTimes(1);
    const [event, callback] = (gameStateService.subscribe as jest.Mock).mock.calls[0];
    expect(event).toBe(gameStateService.EVENTS.CORRECT_STONE_POSITION);

    const mockData = {
      stonePosVal: [1, 2, 3],
      img: { src: 'fakeImage' },
      levelData: { levelNumber: '0' }
    };

    callback(mockData);

    expect(tutorial.stoneImg).toEqual(mockData.img);
    expect(tutorial.x).toBe(mockAnimateImagePosVal.x);
    expect(tutorial.y).toBe(mockAnimateImagePosVal.y);
    expect(tutorial.stonePosDetailsType).toEqual(mockStonePosDetails);
  });
});