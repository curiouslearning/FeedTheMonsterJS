import { loadImages } from "@common";
import { EventManager } from "@events";
import { AudioPlayer } from "@components";
import { TIMER_EMPTY, ROTATING_CLOCK, AUDIO_TIMEOUT, AUDIO_PATH_POINTS_ADD, AUDIO_INTRO } from "@constants";
import './timerHtml/timerHtml.scss';
import TimerHTMLComponent from './timerHtml/timerHtml';


export default class TimerTicking extends EventManager {
    public hasPlayedTimerStartSFX: boolean = false;
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
        // Preload the timer start SFX to avoid playback delay
        this.audioPlayer.preloadGameAudio(AUDIO_PATH_POINTS_ADD);
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
        // it will start timer immediately
        this.readyTimer();
        this.startMyTimer = true;
        this.isMyTimerOver = false;
        this.hasPlayedTimerStartSFX = false; // Reset SFX flag on timer start
    }

    readyTimer() {
        // make timer look full so as it get start signal..... it will start decreasing
        this.timer = 0;     
        if (this.timerFullContainer) this.timerFullContainer.style.width = "100%"; // Reset width on start
    }
    update(deltaTime) {
        // console.log('update')
        if (this.startMyTimer && !this.isStoneDropped) {
            // Play timer start SFX only once per timer start
            if (!this.hasPlayedTimerStartSFX) {
                try {
                    this.audioPlayer.playAudio(AUDIO_PATH_POINTS_ADD);
                } catch (e) {
                    console.warn('Failed to play timer start SFX:', e);
                }
                this.hasPlayedTimerStartSFX = true;
            }

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
        const element = document.getElementById("rotating-clock");
        if (!element) return;

        if (condition) {
            // Resume rotation - use CSS animation-play-state for seamless resumption
            element.style.animationPlayState = "running";
            if (!element.style.animation || element.style.animation === "none") {
                element.style.animation = "rotateClock 3s linear infinite";
            }
        } else {
            // Pause rotation - use CSS animation-play-state for seamless pausing
            if (element.style.animation && element.style.animation !== "none") {
                element.style.animationPlayState = "paused";
            } else {
                element.style.animation = "none";
            }
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