// level-selection-screen.test.ts
import { LevelSelectionScreen }  from './level-selection-scene';
import gameStateService from '@gameStateService';
import { AnalyticsIntegration } from '../../analytics/analytics-integration';

// --- Mocks ---
jest.mock('@gameStateService', () => ({
  EVENTS: {
    GAMEPLAY_DATA_EVENT: 'GAMEPLAY_DATA_EVENT',
    SWITCH_SCENE_EVENT: 'SWITCH_SCENE_EVENT',
  },
  publish: jest.fn(),
  getFTMData: jest.fn(() => ({
    levels: [
      { name: 'Level 1' },
      { name: 'Level 2' }
    ]
  }))
}));

jest.mock('@data', () => ({
  GameScore: {
    getAllGameLevelInfo: jest.fn(() => [])
  },
  getData: jest.fn(() => Promise.resolve({ majversion: '1', minversion: '0' }))
}));

jest.mock('../../analytics/analytics-integration', () => ({
  AnalyticsIntegration: {
    getInstance: jest.fn(() => ({
      track: jest.fn(),
    }))
  },
  AnalyticsEventType: {
    SELECTED_LEVEL: 'SELECTED_LEVEL'
  }
}));

jest.mock('./level-selection-controller', () => {
  return {
    levelSelectionController: jest.fn().mockImplementation(() => ({
      dispose: jest.fn()
    }))
  }
});

// --- Test ---
describe('LevelSelectionScreen startGame', () => {
  let screen: LevelSelectionScreen;

  beforeEach(() => {
    jest.clearAllMocks();
    screen = new LevelSelectionScreen();
  });

  test('should publish gameplay data and switch scene', () => {
    const sampleLevel = 1;

    // act
    (screen as any).startGame(sampleLevel);

    const expectedGameplayData = {
      currentLevelData: {
        name: 'Level 2',
        levelNumber: sampleLevel
      },
      selectedLevelNumber: sampleLevel
    };

    // assert publish for GAMEPLAY_DATA_EVENT
    expect(gameStateService.publish).toHaveBeenCalledWith(
      'GAMEPLAY_DATA_EVENT',
      expectedGameplayData
    );

    // assert publish for SWITCH_SCENE_EVENT
    expect(gameStateService.publish).toHaveBeenCalledWith(
      'SWITCH_SCENE_EVENT',
      expect.any(String) // SCENE_NAME_GAME_PLAY
    );
  });
});
