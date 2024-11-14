import { TimerTicking } from './timer-ticking';

describe("TimerTicking", () => {
    let timerTicking: TimerTicking;

    beforeEach(() => {
        timerTicking = new TimerTicking(300, 100, jest.fn());
    });

    afterEach(() => {
        timerTicking.dispose();
    });

    test("should create timer HTML on initialization", () => {
        expect(document.getElementById("timer-ticking")).toBeTruthy();
    });

    test("should remove timer from DOM on dispose", () => {
        timerTicking.dispose();
        expect(document.getElementById("timer-ticking")).toBeNull();
    });

    test("should start timer and update correctly", () => {
        timerTicking.startTimer();
        expect(timerTicking.isMyTimerOver).toBe(false);
    });

    test("should handle timer depletion and callback when time is up", () => {
        timerTicking.update(10000); // simulate large deltaTime
        expect(timerTicking.isMyTimerOver).toBe(true);
        expect(timerTicking.callback).toHaveBeenCalledWith(true);
    });
});
