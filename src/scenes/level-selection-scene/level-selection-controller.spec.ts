import { levelSelectionController } from './level-selection-controller';
import { GameScore } from '@data';
import { AudioPlayer } from "@components";

jest.mock("@components", () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playAudio: jest.fn(),
    stopAllAudios: jest.fn(),
    playButtonClickSound: jest.fn(),
  })),
}));

jest.mock('@data', () => ({
  GameScore: {
    getHighestLevelReached: jest.fn(),
    getGameLevelData: jest.fn(),
  },
}));

const mockGetHighestLevelReached = GameScore.getHighestLevelReached as jest.Mock;
const mockGetGameLevelData = GameScore.getGameLevelData as jest.Mock;

describe('levelSelectionController', () => {
  let controller: any;
  let startGameCallback: jest.Mock;

  beforeEach(() => {
    mockGetHighestLevelReached.mockReturnValue(-1);
    mockGetGameLevelData.mockReturnValue(null);

    document.body.innerHTML = `<div id="root"></div>`;

    startGameCallback = jest.fn();

    controller = new levelSelectionController({
      id: 'test-id',
      options: { selectors: { root: '#root' } },
      startGameCallback,
      maxGameLevels: 12,
      playedGameLevels: [],
      previousPlayedLevel: 0,
      isDebuggerOn: false,
      gameLevels: [],
    });
  });

  afterEach(() => {
    controller.dispose?.();
    jest.clearAllMocks();
  });

  it('should initialize with correct total pages and current page', () => {
    expect(controller.totalPages).toBe(2); // 12 / 10 => 2 pages
    expect(controller.currentPage).toBe(1);
  });

  it('should create 12 buttons', () => {
    expect(Object.keys(controller.btnList).length).toBe(12);
  });

  it('should navigate pages correctly', () => {
    const spyUpdate = jest.spyOn(controller, 'updateLevelButtons');

    controller.goToNextPage();
    expect(controller.currentPage).toBe(2);
    expect(spyUpdate).toHaveBeenCalledTimes(1);

    controller.goToPrevPage();
    expect(controller.currentPage).toBe(1);
    expect(spyUpdate).toHaveBeenCalledTimes(2);
  });

  it('should call startGameCallback with 0-based index when level clicked', () => {
    controller.handleGameLevelOnClick(1);
    expect(startGameCallback).toHaveBeenCalledWith(0);
  });

  describe('Feature: updateNextPlayableLevel', () => {
    describe('Scenario: No levels have been played yet', () => {
      it('Given getHighestLevelReached returns -1, when updateNextPlayableLevel is called, then nextPlayableLevel is set to 1', () => {
        // Given
        mockGetHighestLevelReached.mockReturnValue(-1);

        // When
        controller.updateNextPlayableLevel();

        // Then
        expect(controller.nextPlayableLevel).toBe(1);
      });
    });

    describe('Scenario: Highest level was passed', () => {
      it('Given the highest played level (0-based 2) was passed with 3 stars, when updateNextPlayableLevel is called, then nextPlayableLevel advances past it', () => {
        // Given
        mockGetHighestLevelReached.mockReturnValue(2);
        mockGetGameLevelData.mockReturnValue({ starCount: 3 });

        // When
        controller.updateNextPlayableLevel();

        // Then — (2 + 1) + 1 = 4
        expect(controller.nextPlayableLevel).toBe(4);
      });

      it('Given the highest played level (0-based 2) was passed with 5 stars, when updateNextPlayableLevel is called, then nextPlayableLevel advances past it', () => {
        // Given
        mockGetHighestLevelReached.mockReturnValue(2);
        mockGetGameLevelData.mockReturnValue({ starCount: 5 });

        // When
        controller.updateNextPlayableLevel();

        // Then — (2 + 1) + 1 = 4
        expect(controller.nextPlayableLevel).toBe(4);
      });
    });

    describe('Scenario: Highest level was failed', () => {
      it('Given the highest played level (0-based 2) was failed with 1 star, when updateNextPlayableLevel is called, then nextPlayableLevel stays on that level', () => {
        // Given
        mockGetHighestLevelReached.mockReturnValue(2);
        mockGetGameLevelData.mockReturnValue({ starCount: 1 });

        // When
        controller.updateNextPlayableLevel();

        // Then — (2 + 1) + 0 = 3
        expect(controller.nextPlayableLevel).toBe(3);
      });

      it('Given the highest played level (0-based 2) was failed with 2 stars, when updateNextPlayableLevel is called, then nextPlayableLevel stays on that level', () => {
        // Given
        mockGetHighestLevelReached.mockReturnValue(2);
        mockGetGameLevelData.mockReturnValue({ starCount: 2 });

        // When
        controller.updateNextPlayableLevel();

        // Then — (2 + 1) + 0 = 3
        expect(controller.nextPlayableLevel).toBe(3);
      });
    });
  });

  describe('nextLevelIsPlayable', () => {
    it('should return true for next level when previous level is passed', () => {
      // Given
      mockGetHighestLevelReached.mockReturnValue(0);
      mockGetGameLevelData.mockReturnValue({ starCount: 3 });
      controller.updateNextPlayableLevel(); // nextPlayableLevel = (0+1)+1 = 2

      const result = controller.nextLevelIsPlayable(2);
      expect(result).toBe(true);
    });

    it('should return true for same level when previous level is failed', () => {
      // Given
      mockGetHighestLevelReached.mockReturnValue(0);
      mockGetGameLevelData.mockReturnValue({ starCount: 1 });
      controller.updateNextPlayableLevel(); // nextPlayableLevel = (0+1)+0 = 1

      const result = controller.nextLevelIsPlayable(1);
      expect(result).toBe(true);
    });

    it('should return false for other levels', () => {
      // Given
      mockGetHighestLevelReached.mockReturnValue(0);
      mockGetGameLevelData.mockReturnValue({ starCount: 3 });
      controller.updateNextPlayableLevel(); // nextPlayableLevel = 2

      const result = controller.nextLevelIsPlayable(3);
      expect(result).toBe(false);
    });

    it('should always return false when debugger mode is on', () => {
      controller.isDebuggerOn = true;

      const result = controller.nextLevelIsPlayable(1);
      expect(result).toBe(false);
    });
  });

  it('should correctly calculate opening page from previousPlayedLevel', () => {
    const page = controller.getOpeningPage(11, 10);
    expect(page).toBe(2);
  });

  it('should lock levels higher than current playable level', () => {
    // Given
    mockGetHighestLevelReached.mockReturnValue(0);
    mockGetGameLevelData.mockReturnValue({ starCount: 3 });
    controller.updateNextPlayableLevel(); // nextPlayableLevel = 2

    const isLocked = controller.isGameLocked(3, 2);
    expect(isLocked).toBe(true);
  });
});
