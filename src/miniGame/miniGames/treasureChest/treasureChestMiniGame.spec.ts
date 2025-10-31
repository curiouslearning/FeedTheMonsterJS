import { TreasureChestMiniGame } from './treasureChestMiniGame';
import { TreasureChestAnimation } from './treasureChestAnimation';
import TreasureStones from './treasureStones';

// Mock dependencies
jest.mock('./treasureChestAnimation', () => {
  return {
    TreasureChestAnimation: jest.fn().mockImplementation(() => ({
      getContext: jest.fn().mockReturnValue({}),
      setTreasureStones: jest.fn(),
      show: jest.fn((onComplete) => onComplete && onComplete()), // immediately trigger completion callback
      showBlueBonusStar: jest.fn(),
      hide: jest.fn(),
    })),
  };
});

jest.mock('./treasureStones', () => {
  return jest.fn().mockImplementation(() => ({
    startTimer: jest.fn(),
    onStoneCollected: null,
    onThresholdTimeReached: null,
  }));
});

describe('Testing TreasureChestMiniGame.', () => {
  it('should create TreasureChestAnimation and TreasureStones instances and complete mini game flow', () => {
    const mockCallback = jest.fn();

    // Create instance
    const miniGame = new TreasureChestMiniGame(mockCallback);

    // Verify initialization
    expect(TreasureChestAnimation).toHaveBeenCalledTimes(1);
    expect(TreasureStones).toHaveBeenCalledTimes(1);

    // Simulate player collecting stones
    miniGame['collectedBeforeThreshold'] = 3;

    // Run draw to trigger animation
    miniGame.draw();

    // After animation completes, processStoneCollection should run and call the callback
    expect(mockCallback).toHaveBeenCalledWith(1);
  });
});
