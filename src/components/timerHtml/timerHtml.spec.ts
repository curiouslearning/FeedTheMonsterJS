// timer-ticking.test.ts
import TimerTicking from '../timer-ticking';
import TimerHTMLComponent from './timerHtml';
import { AudioPlayer } from '@components';

// Mock dependencies
jest.mock('./timerHtml');
jest.mock('@components', () => ({
  AudioPlayer: jest.fn(() => ({
    playAudio: jest.fn(),
  })),
}));

describe('TimerTicking', () => {
  let timerTicking: TimerTicking;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    // Mock DOM structure
    document.body.innerHTML = `
      <div id="timer-ticking"></div>
      <div id="timer-full-container"></div>
    `;

    // Mock callback
    mockCallback = jest.fn();

    // Initialize TimerTicking instance
    timerTicking = new TimerTicking(800, 600, mockCallback);
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = ''; // Clean up DOM
  });

  test('should initialize TimerHTMLComponent and set timerFullContainer', async () => {
    // Wait for the asynchronous code inside the constructor to finish
    await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for the setTimeout to execute

    expect(TimerHTMLComponent).toHaveBeenCalledWith('timer-ticking');
    expect(timerTicking.timerFullContainer).not.toBeNull();
    expect(timerTicking.timerFullContainer?.style.width).toBe('100%');
  });

  test('should start the timer and reset width', () => {
    const spyReadyTimer = jest.spyOn(timerTicking, 'readyTimer');
    timerTicking.startTimer();

    expect(spyReadyTimer).toHaveBeenCalled();
    expect(timerTicking.startMyTimer).toBe(true);
    expect(timerTicking.isMyTimerOver).toBe(false);
    expect(timerTicking.timerFullContainer?.style.width).toBe('100%');
  });

  test('should update the timer and reduce the width', () => {
    const deltaTime = 16; // Simulate a frame duration
    timerTicking.startTimer();
    timerTicking.update(deltaTime);

    const expectedWidth = `${Math.max(0, 100 - deltaTime * 0.008)}%`;
    expect(timerTicking.timerFullContainer?.style.width).toBe(expectedWidth);
  });

  test('should call callback and play audio when timer is over', () => {
    const deltaTime = 20000; // Simulate a large frame duration to deplete the timer
    timerTicking.startTimer();
    timerTicking.update(deltaTime);

    expect(timerTicking.isMyTimerOver).toBe(true);
    expect(mockCallback).toHaveBeenCalledWith(true);
    expect((timerTicking.audioPlayer as any).playAudio).toHaveBeenCalledWith(expect.any(String));
  });

  test('should handle stone drop and stop timer updates', async () => {
    // Wait for the constructor code to execute
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Start the timer
    timerTicking.startTimer();

    // Simulate a stone drop
    timerTicking.handleStoneDrop({});

    // Check that the stone drop handler was called
    expect(timerTicking.isStoneDropped).toBe(true);

    // Ensure that the timer stops and width does not change
    // Call update to simulate timer behavior
    timerTicking.update(100); // You can adjust this value as necessary for your test scenario

    // The width should remain at 100% since the stone has been dropped
    expect(timerTicking.timerFullContainer?.style.width).toBe('100%');
  });

  test('should call stopTimer when destroy is called', () => {
    // Spy on stopTimer method
    const stopTimerSpy = jest.spyOn(timerTicking, 'stopTimer');

    // Call the destroy method
    timerTicking.destroy();

    // Assert that stopTimer was called
    expect(stopTimerSpy).toHaveBeenCalled();
  });
});
