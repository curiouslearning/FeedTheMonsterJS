import LevelSelectionLevelButton from './level-selection-level-btn';
import { MAP_LOCK_IMG, STAR_IMG } from '@constants';
import { BaseButtonComponent } from '@components/buttons/base-button-component/base-button-component';

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

    // Update stars using bracket cast
    (button as any).updateStarDisplay(1);
    expect((button as any)['starsCount']).toBe(1);
    expect((button as any)['star-1'].style.display).toBe('none');
  });

  it('should call callback when clicked if not locked', () => {
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

    // Simulate click
    (button as any).handleOnClick();
    expect(mockCallback).toHaveBeenCalledWith(4);

    // Locked button should not call callback
    button.updateBtn(4, true, 0);
    (button as any).handleOnClick();
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
