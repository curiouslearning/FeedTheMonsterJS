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

  beforeEach(() => {
    // Create a root element for BaseHTML to render into
    document.body.innerHTML = `<div id="root"></div>`;

    controller = new levelSelectionController({
      id: 'test-id',
      options: { selectors: { root: '#root' } }, // <-- correct BaseHtmlOptions
      startGameCallback: jest.fn(),
      maxGameLevels: 12,
      playedGameLevels: [{ levelNumber: 0, starCount: 3 }],
      previousPlayedLevel: 0,
      isDebuggerOn: false,
      gameLevels: [],
    });
  });

  it('should initialize with correct total pages and current page', () => {
    expect(controller.totalPages).toBe(2); // 12 / 10 levels per page => 2 pages
    expect(controller.currentPage).toBe(1);
  });

  it('should create 12 buttons', () => {
    expect(Object.keys(controller.btnList).length).toBe(12);
  });

  it('should navigate pages correctly', () => {
    const spyUpdate = jest.spyOn(controller, 'updateLevelButtons');

    controller.goToNextPage();
    expect(controller.currentPage).toBe(2);
    expect(spyUpdate).toHaveBeenCalled();

    controller.goToPrevPage();
    expect(controller.currentPage).toBe(1);
    expect(spyUpdate).toHaveBeenCalledTimes(2);
  });

  it('should call startGameCallback with 0-based index when level clicked', () => {
    const mockCallback = jest.fn();
    controller.startGameCallback = mockCallback;

    // Simulate clicking a game level
    controller.handleGameLevelOnClick(1);

    expect(mockCallback).toHaveBeenCalledWith(0); // 1-based level converted to 0-based
  });
});
