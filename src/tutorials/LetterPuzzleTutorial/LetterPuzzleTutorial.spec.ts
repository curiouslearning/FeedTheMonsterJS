import LetterPuzzleTutorial from './LetterPuzzleTutorial';
import gameStateService from '@gameStateService';

// Mock TutorialComponent base class
jest.mock('@components', () => ({
  TutorialComponent: class {
    quickStartTutorial = jest.fn();
    drawPointer = jest.fn();
    drawRipple = jest.fn();
    setGameHasStarted = jest.fn();
    setGameHasEndedFlag = jest.fn();
    updateTargetStonePositions = jest.fn(() => mockStonePosDetails);
    animateStoneDrag = jest.fn();
  }
}));

// Mock return value for updateTargetStonePositions
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

// Mock gameStateService
jest.mock('@gameStateService', () => ({
  EVENTS: {
    CORRECT_STONE_POSITION: 'CORRECT_STONE_POSITION'
  },
  subscribe: jest.fn()
}));

describe('LetterPuzzleTutorial', () => {
  let mockContext;

  beforeEach(() => {
    mockContext = {};
    (gameStateService.subscribe as jest.Mock).mockClear();
  });

  it('should subscribe to the correct event and update properties when level is 0', () => {
    const width = 800;
    const height = 600;

    const tutorial = new LetterPuzzleTutorial(mockContext, width, height);

    expect(gameStateService.subscribe).toHaveBeenCalledTimes(1);
    const [event, callback] = (gameStateService.subscribe as jest.Mock).mock.calls[0];

    expect(event).toBe(gameStateService.EVENTS.CORRECT_STONE_POSITION);
    expect(typeof callback).toBe('function');

    // Simulate receiving the event with level 0
    const mockData = {
      stonePosVal: [1, 2, 3],
      img: { src: 'fakeImage' },
      levelData: { levelNumber: '0' }
    };

    callback(mockData);

    expect(tutorial.stoneImg).toEqual(mockData.img);
    expect(tutorial.x).toBe(mockAnimateImagePosVal.x);
    expect(tutorial.y).toBe(mockAnimateImagePosVal.y);
    expect(tutorial.gameLevel).toBe(0);
    expect(tutorial.stonePosDetailsType).toEqual(mockStonePosDetails);
  });
});