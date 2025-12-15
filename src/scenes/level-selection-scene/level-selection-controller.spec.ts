import { levelSelectionController } from './level-selection-controller';
import { AudioPlayer } from "@components";

jest.mock("@components", () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playAudio: jest.fn(),
    stopAllAudios: jest.fn(),
    playButtonClickSound: jest.fn(),
  })),
}));

describe('levelSelectionController', () => {
  let controller: any;
  let startGameCallback: jest.Mock;

  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;

    startGameCallback = jest.fn();

    controller = new levelSelectionController({
      id: 'test-id',
      options: { selectors: { root: '#root' } },
      startGameCallback,
      maxGameLevels: 12,
      playedGameLevels: [{ levelNumber: 0, starCount: 3 }],
      previousPlayedLevel: 0,
      isDebuggerOn: false,
      gameLevels: [],
    });
  });

  afterEach(() => {
    controller.dispose?.();
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

  describe('isNextPlayableLevel', () => {
    it('should return true for next level when previous level is passed', () => {
      controller.playedGameLevels = [
        { levelNumber: 0, starCount: 3 },
      ];

      const result = controller.isNextPlayableLevel(2);
      expect(result).toBe(true);
    });

    it('should return true for same level when previous level is failed', () => {
      controller.playedGameLevels = [
        { levelNumber: 0, starCount: 1 },
      ];

      const result = controller.isNextPlayableLevel(1);
      expect(result).toBe(true);
    });

    it('should return false for other levels', () => {
      controller.playedGameLevels = [
        { levelNumber: 0, starCount: 3 },
      ];

      const result = controller.isNextPlayableLevel(3);
      expect(result).toBe(false);
    });

    it('should always return false when debugger mode is on', () => {
      controller.isDebuggerOn = true;

      const result = controller.isNextPlayableLevel(1);
      expect(result).toBe(false);
    });
  });

  it('should correctly calculate opening page from previousPlayedLevel', () => {
    const page = controller.getOpeningPage(11, 10);
    expect(page).toBe(2);
  });

  it('should lock levels higher than current playable level', () => {
    controller.playedGameLevels = [
      { levelNumber: 0, starCount: 3 },
    ];

    const isLocked = controller.isGameLocked(3, 2);
    expect(isLocked).toBe(true);
  });
});
