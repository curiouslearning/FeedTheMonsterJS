import LevelSelectionLevelButton from './level-selection-level-btn';

// Mock constants
jest.mock('@constants', () => ({
  MAP_LOCK_IMG: 'mock-lock.png',
  STAR_IMG: 'mock-star.png',
}));

// Mock AudioPlayer to prevent actual audio playback
jest.mock('@components/audio-player', () => ({
  AudioPlayer: jest.fn().mockImplementation(() => ({
    playButtonClickSound: jest.fn(),
    stopAllAudios: jest.fn(),
  })),
}));

describe('LevelSelectionLevelButton', () => {
  let button: LevelSelectionLevelButton;
  const mockCallback = jest.fn();

  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
    mockCallback.mockClear();
  });

  it('should create button with text and pulse effect for current level', () => {
    button = new LevelSelectionLevelButton({
      index: 0,
      options: { id: 'btn-0', className: 'level-btn', targetId: 'root' },
      isCurrentLevel: true,
      gameLevel: 1,
      isLevelLock: false,
      starsCount: 0,
      isDebuggerOn: false,
      levelTypeText: '',
      callback: mockCallback,
    });

    const el = button.getElement();
    expect(el.classList.contains('pulsing')).toBe(true);
    expect(el.textContent).toContain('1');
  });

  it('should create lock image if button is locked', () => {
    button = new LevelSelectionLevelButton({
      index: 1,
      options: { id: 'btn-1', className: 'level-btn', targetId: 'root' },
      isCurrentLevel: false,
      gameLevel: 2,
      isLevelLock: true,
      starsCount: 0,
      isDebuggerOn: false,
      levelTypeText: '',
      callback: mockCallback,
    });

    const lockImg = button.getElement().querySelector('img');
    expect(lockImg).not.toBeNull();
    expect(lockImg?.src).toContain('mock-lock.png');
  });

  it('should create stars and update star display', () => {
    button = new LevelSelectionLevelButton({
      index: 2,
      options: { id: 'btn-2', className: 'level-btn', targetId: 'root' },
      isCurrentLevel: false,
      gameLevel: 3,
      isLevelLock: false,
      starsCount: 2,
      isDebuggerOn: false,
      levelTypeText: '',
      callback: mockCallback,
    });

    const stars = button.getElement().querySelectorAll('img');
    expect(stars.length).toBe(2);
    expect(stars[0].src).toContain('mock-star.png');

    // Update stars
    (button as any).updateStarDisplay(1);
    expect((button as any)['starsCount']).toBe(1);
    expect((button as any)['star-1'].style.display).toBe('none');
  });

  it('should call callback when DOM button is clicked and not locked', () => {
    button = new LevelSelectionLevelButton({
      index: 3,
      options: { id: 'btn-3', className: 'level-btn', targetId: 'root' },
      isCurrentLevel: false,
      gameLevel: 4,
      isLevelLock: false,
      starsCount: 0,
      isDebuggerOn: false,
      levelTypeText: '',
      callback: mockCallback,
    });

    // Real DOM click
    button.getElement().click();
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(4);
  });

  it('should NOT register click handler when button is locked', () => {
    button = new LevelSelectionLevelButton({
      index: 4,
      options: { id: 'btn-4', className: 'level-btn', targetId: 'root' },
      isCurrentLevel: false,
      gameLevel: 5,
      isLevelLock: true,
      starsCount: 0,
      isDebuggerOn: false,
      levelTypeText: '',
      callback: mockCallback,
    });

    // Attempt DOM click
    button.getElement().click();

    // Callback should never fire because super.onClick was never registered
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
