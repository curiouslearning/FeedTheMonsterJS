import { MiniGameHandler } from './miniGameHandler';
import miniGameStateService from '@miniGameStateService';
import { TreasureChestMiniGame } from './treasureChest/treasureChestMiniGame';

// Mock dependencies
jest.mock('@miniGameStateService', () => ({
  publish: jest.fn(),
  EVENTS: {
    IS_MINI_GAME_DONE: 'IS_MINI_GAME_DONE',
  },
}));

jest.mock('./treasureChest/treasureChestMiniGame', () => {
  return {
    TreasureChestMiniGame: jest.fn().mockImplementation(() => ({
      draw: jest.fn(),
      dispose: jest.fn(),
    })),
  };
});

describe('Testing MiniGameHandler', () => {
  it('should create a TreasureChestMiniGame instance on initialization', () => {
    const handler = new MiniGameHandler(5); // any level number

    // verify a new TreasureChestMiniGame was instantiated
    expect(TreasureChestMiniGame).toHaveBeenCalledTimes(1);

    // verify activeMiniGame was assigned
    expect(handler.activeMiniGame).not.toBeNull();
    expect(handler.activeMiniGame).toEqual(expect.objectContaining({
      draw: expect.any(Function),
      dispose: expect.any(Function),
    }));
  });
});
