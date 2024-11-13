import { TimerTicking } from './timer-ticking';
import { AudioPlayer } from '@components';
import { AUDIO_TIMEOUT } from '@constants';

describe('TimerTicking', () => {
    let timerTicking: TimerTicking;
    const callbackMock = jest.fn();

    beforeEach(() => {
        // Clear any existing HTML and callback mock calls
        document.body.innerHTML = '';
        callbackMock.mockClear();

        // Create a new instance of TimerTicking
        timerTicking = new TimerTicking(300, 150, callbackMock);
        timerTicking.audioPlayer.playAudio = jest.fn(); // Ensure playAudio is defined in the instance
    });

    afterEach(() => {
        timerTicking.dispose();
    });

    it('should initialize correctly with default values', () => {
        expect(timerTicking.width).toBe(300);
        expect(timerTicking.height).toBe(150);
        expect(timerTicking.timer).toBe(0);
        expect(timerTicking.isTimerStarted).toBe(false);
        expect(timerTicking.isTimerEnded).toBe(false);
        expect(timerTicking.isTimerRunningOut).toBe(false);
        expect(timerTicking.imagesLoaded).toBe(false);
        expect(document.getElementById('timer-ticking')).not.toBeNull();
    });

    it('should create and insert timer HTML on initialization', () => {
        const timeTickerElement = document.getElementById('timer-ticking');
        expect(timeTickerElement).not.toBeNull();
        expect(timeTickerElement.querySelector('#timer-empty')).not.toBeNull();
        expect(timeTickerElement.querySelector('#rotating-clock')).not.toBeNull();
        expect(timeTickerElement.querySelector('#timer-full-container')).not.toBeNull();
    });

    it('should start and reset the timer when startTimer is called', () => {
        timerTicking.startTimer();
        expect(timerTicking.startMyTimer).toBe(true);
        expect(timerTicking.isMyTimerOver).toBe(false);
        expect(timerTicking.timerFullContainer.style.width).toBe('100%');
    });

    it('should update timer depletion correctly in update()', () => {
        timerTicking.startTimer();
        timerTicking.update(10); // Simulate a small deltaTime

        // Timer should be partially depleted
        const widthPercentage = parseFloat(timerTicking.timerFullContainer.style.width);
        expect(widthPercentage).toBeLessThan(100);
    });

    it('should trigger the callback when timer depletes completely', () => {
        timerTicking.startTimer();
        timerTicking.update(12500); // Simulate enough time for timer to fully deplete

        expect(timerTicking.isMyTimerOver).toBe(true);
        expect(callbackMock).toHaveBeenCalledWith(true);
    });

    it('should play timeout audio only once when timer is running out', () => {
        const playAudioSpy = jest.spyOn(timerTicking.audioPlayer, 'playAudio');
        timerTicking.startTimer();
        
        // Simulate timer almost depleting
        timerTicking.update(12450); // Close to timeout
        expect(playAudioSpy).toHaveBeenCalledWith(AUDIO_TIMEOUT);
        expect(timerTicking.playLevelEndAudioOnce).toBe(false);

        // Run update again to confirm audio doesn't play twice
        timerTicking.update(50);
        expect(playAudioSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle stone drop and prevent timer from updating', () => {
        timerTicking.startTimer();
        timerTicking.handleStoneDrop({});

        expect(timerTicking.isStoneDropped).toBe(true);
        
        const previousTimer = timerTicking.timer;
        timerTicking.update(10);
        expect(timerTicking.timer).toBe(previousTimer); // Timer shouldn't update
    });

    it('should restart timer on load puzzle event', () => {
        timerTicking.handleLoadPuzzle({});
        expect(timerTicking.startMyTimer).toBe(true);
        expect(timerTicking.isStoneDropped).toBe(false);
    });

    it('should remove timer element on dispose', () => {
        timerTicking.dispose();
        expect(document.getElementById('timer-ticking')).toBeNull();
    });
});
