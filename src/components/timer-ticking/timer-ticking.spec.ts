import { TimerTicking } from './timer-ticking';
import { AudioPlayer } from '@components';

jest.mock('@components', () => ({
    AudioPlayer: jest.fn().mockImplementation(() => ({
        playAudio: jest.fn()
    })),
}));

describe('TimerTicking', () => {
    let timerTicking: TimerTicking;
    const mockCallback = jest.fn();

    beforeEach(() => {
        document.body.innerHTML = '<div id="background"></div>'; // Mock the DOM environment
        timerTicking = new TimerTicking(300, 150, mockCallback);
    });

    afterEach(() => {
        jest.clearAllMocks();
        timerTicking.dispose();
    });

    test('should render timer HTML structure correctly', () => {
        timerTicking.createTimerHtml();
        const timerElement = document.getElementById('timer-ticking');
        expect(timerElement).not.toBeNull();
        expect(timerElement?.querySelector('#timer-empty')).not.toBeNull();
        expect(timerElement?.querySelector('#rotating-clock')).not.toBeNull();
        expect(timerElement?.querySelector('#timer-full-container')).not.toBeNull();
    });

    test('should start the timer and update the width of timer-full-container', () => {
        timerTicking.createTimerHtml();
        timerTicking.startTimer();

        const timerFullContainer = document.querySelector('#timer-full-container') as HTMLElement;
        expect(timerFullContainer.style.width).toBe('100%');

        timerTicking.update(100); // Simulate 100 ms of update time
        expect(parseFloat(timerFullContainer.style.width)).toBeLessThan(100);
    });

    test('should trigger callback when timer runs out', () => {
        timerTicking.createTimerHtml();
        timerTicking.startTimer();

        // Simulate the timer running out
        for (let i = 0; i < 15000; i++) {
            timerTicking.update(1);
        }

        expect(mockCallback).toHaveBeenCalledWith(true);
    });

    test('should play timeout audio when timer is running out', () => {
        const audioPlayer = (timerTicking as any).audioPlayer as AudioPlayer;
        timerTicking.createTimerHtml();
        timerTicking.startTimer();

        // Simulate the timer nearing the end
        for (let i = 0; i < 14500; i++) {
            timerTicking.update(1);
        }

        expect(audioPlayer.playAudio).toHaveBeenCalledWith(expect.any(String));
    });

    test('should dispose the timer and remove its HTML from the DOM', () => {
        timerTicking.createTimerHtml();
        expect(document.getElementById('timer-ticking')).not.toBeNull();

        timerTicking.dispose();
        expect(document.getElementById('timer-ticking')).toBeNull();
    });

    test('should not render multiple times when render is called repeatedly', () => {
        timerTicking.createTimerHtml();
        timerTicking.createTimerHtml(); // Call render again

        const timerElements = document.querySelectorAll('#timer-ticking');
        expect(timerElements.length).toBe(1); // Ensure only one instance exists
    });

    test('should handle stone drop and pause the timer', () => {
        timerTicking.createTimerHtml();
        timerTicking.startTimer();

        timerTicking.handleStoneDrop(new Event('stoneDrop'));
        timerTicking.update(100); // Simulate 100 ms of update time

        const timerFullContainer = document.querySelector('#timer-full-container') as HTMLElement;
        const currentWidth = parseFloat(timerFullContainer.style.width);

        // The width should not change since the timer is paused
        timerTicking.update(100);
        expect(parseFloat(timerFullContainer.style.width)).toBe(currentWidth);
    });

    test('should reset state on handleLoadPuzzle', () => {
        timerTicking.createTimerHtml();
        timerTicking.startTimer();

        timerTicking.handleLoadPuzzle(new Event('loadPuzzle'));

        expect(timerTicking.startMyTimer).toBe(true);
        expect(timerTicking.isStoneDropped).toBe(false);
    });
});
