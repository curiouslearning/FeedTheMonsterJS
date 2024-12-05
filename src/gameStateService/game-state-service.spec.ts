import {GameStateService} from './game-state-service';

describe('GameStateService - isLastLevel', () => {
  let gameStateService: GameStateService;

  beforeEach(() => {
    gameStateService = new GameStateService();
  });

  test('should set isLastLevel to false when current level is not the last level', () => {
    const mockLevelEndData = {
      currentLevel: 2,
    };

    const mockData = {
      levels: [
        {levelMeta: {levelNumber: 1}},
        {levelMeta: {levelNumber: 2}},
        {levelMeta: {levelNumber: 3}}, // Last level
      ],
    };

    gameStateService.levelEndSceneData({
      levelEndData: mockLevelEndData,
      data: mockData,
    });

    expect(gameStateService.isLastLevel).toBe(false);
  });

  test('should set isLastLevel to true when current level is the last level', () => {
    const mockLevelEndData = {
      currentLevel: 3,
    };

    const mockData = {
      levels: [
        {levelMeta: {levelNumber: 1}},
        {levelMeta: {levelNumber: 2}},
        {levelMeta: {levelNumber: 3}}, // Last level
      ],
    };

    gameStateService.levelEndSceneData({
      levelEndData: mockLevelEndData,
      data: mockData,
    });

    expect(gameStateService.isLastLevel).toBe(true);
  });
});
