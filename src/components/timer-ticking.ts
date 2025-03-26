import { loadImages } from "@common";
import { EventManager } from "@events";
import { AudioPlayer } from "@components";
import { TIMER_EMPTY, ROTATING_CLOCK, AUDIO_TIMEOUT } from "@constants";
import './timerHtml/timerHtml.scss';
import TimerHTMLComponent from './timerHtml/timerHtml';


export default class TimerTicking extends EventManager {
    public width: number;
    public height: number;
    public timerWidth: number;
    public timerHeight: number;
    public widthToClear: number;
    public timer: number;
    public isTimerStarted: boolean;
    public isTimerEnded: boolean;
    public isTimerRunningOut: boolean;
    public pauseButtonClicked: boolean;
    public images: Object;
    public loadedImages: any;
    public callback: Function;
    public imagesLoaded: boolean = false;
    public startMyTimer: boolean = true;
    public isMyTimerOver: boolean = false;
    public isStoneDropped: boolean = false;
    public audioPlayer: AudioPlayer;
    public playLevelEndAudioOnce: boolean = true;
    // Additional properties for HTML manipulation
    public timerFullContainer: HTMLElement | null = null;
    public timerHtmlComponent: TimerHTMLComponent;

    constructor(width: number, height: number, callback: Function) {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.width = width;
        this.height = height;
        this.widthToClear = this.width / 3.4;
        this.callback = callback;
        this.timer = 0;
        this.isTimerStarted = false;
        this.isTimerEnded = false;
        this.isTimerRunningOut = false;
        this.audioPlayer = new AudioPlayer();
        this.playLevelEndAudioOnce = true;
        this.images = {
            timer_empty: TIMER_EMPTY,
            rotating_clock: ROTATING_CLOCK,
        }
        //create the timer-ticking structure
        this.timerHtmlComponent = new TimerHTMLComponent('timer-ticking');
        // Reference the container element for the "full timer" image
        // Verify and cache the DOM element after rendering
        setTimeout(() => {
            this.timerFullContainer = document.getElementById("timer-full-container");
            if (this.timerFullContainer) this.timerFullContainer.style.width = "100%";
        }, 0);
        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });

        // Cache the reference after rendering
        this.timerFullContainer = this.getTimerFullContainer();
    }

    startTimer() {
        // it will start timer immediatly
        this.readyTimer();
        this.startMyTimer = true;
        this.isMyTimerOver = false
    }

    readyTimer() {
        // make timer look full so as it get start signal..... it will start decreasing
        this.timer = 0;     
        if (this.timerFullContainer) this.timerFullContainer.style.width = "100%"; // Reset width on start
    }
    update(deltaTime) {
        if (this.startMyTimer && !this.isStoneDropped) {
            this.timer += deltaTime * 0.008;
            // Calculate the new width percentage for the timer
            const timerDepletion = Math.max(0, 100 - this.timer);
            this.timerFullContainer.style.width = `${timerDepletion}%`;

            if (timerDepletion < 100 && timerDepletion > 0) {
                this.applyRotation(true);
            }

            if (timerDepletion < 10 && !this.isMyTimerOver) {
                this.playLevelEndAudioOnce ? this.audioPlayer.playAudio(AUDIO_TIMEOUT) : null;
                this.playLevelEndAudioOnce = false;
            }

            if (timerDepletion <= 0 && !this.isMyTimerOver) {
                this.isMyTimerOver = true;
                this.applyRotation(false); 
                this.callback(true);
            }
        }
    }

    public applyRotation(condition: boolean) {
        setTimeout(() => {
            const element = document.getElementById("rotating-clock");
            if (element) {
                if (condition) {
                    element.style.transform = "translateX(-50%)";
                    element.style.animation = "rotateClock 3s linear infinite";
                } else {
                    element.style.animation = "none";
                }
            }
        }, 0);
    }

    /**
     * Stops the clock rotation when the game is paused
     */
    public pauseRotation(): void {
        // Simply add a CSS class to the parent element that will pause all animations
        const timerContainer = document.getElementById("timer-ticking");
        if (timerContainer) {
            timerContainer.classList.add('paused-animations');
        }
    }

    /**
     * Resumes the clock rotation if the timer is still running
     */
    public resumeRotation(): void {
        // Remove the CSS class to resume all animations
        const timerContainer = document.getElementById("timer-ticking");
        if (timerContainer) {
            timerContainer.classList.remove('paused-animations');
        }
    }

    private getTimerFullContainer(): HTMLElement | null {
        return document.getElementById("timer-full-container");
    }

    stopTimer(): void {
        this.isTimerRunningOut = false;
    }

    public handleStoneDrop(event) {
        this.isStoneDropped = true;
        this.applyRotation(false);
    }
    public handleLoadPuzzle(event) {
        this.playLevelEndAudioOnce = true;
        this.isStoneDropped = false;
        this.startTimer();
    }

    public destroy(): void {
        this.stopTimer();
        this.timerHtmlComponent?.destroy();
    }
}