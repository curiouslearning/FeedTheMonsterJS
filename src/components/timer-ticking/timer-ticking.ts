import { loadImages } from "@common";
import { EventManager } from "@events";
import { AudioPlayer } from "@components";
import { TIMER_EMPTY, ROTATING_CLOCK, TIMER_FULL, AUDIO_TIMEOUT } from "@constants";
import './timer-ticking.scss';

export class TimerTicking extends EventManager {
    public width: number;
    public height: number;
    public timerWidth: number;
    public timerHeight: number;
    public widthToClear: number;
    public timer: number;
    public isTimerStarted: boolean;
    public isTimerEnded: boolean;
    public isTimerRunningOut: boolean;
    public timeTickerElement: HTMLElement;
    public timer_full: HTMLImageElement;
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
    public timerFullContainer: HTMLElement;
    constructor(width: number, height: number, callback: Function) {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.width = width;
        this.height = height;
        this.widthToClear = this.width / 3.4;
        this.callback = callback;
        this.timeTickerElement = document.getElementById("timer-ticking");
        this.timer = 0;
        this.isTimerStarted = false;
        this.isTimerEnded = false;
        this.isTimerRunningOut = false;
        this.audioPlayer = new AudioPlayer();
        this.playLevelEndAudioOnce = true;
        this.images = {
            timer_empty: TIMER_EMPTY,
            rotating_clock: ROTATING_CLOCK,
            timer_full: TIMER_FULL
        }
        //create the timer-ticking structure
        this.createTimerHtml();
        // Reference the container element for the "full timer" image
        this.timerFullContainer = document.getElementById("timer-full-container") as HTMLElement;
        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
    }

    private createTimerHtml() {
        // Create main container
        const container = document.createElement('div');
        container.id = 'timer-ticking';

        // Create images and timer-full-container
        container.innerHTML = `
            <img id="timer-empty" src="${TIMER_EMPTY}" alt="Timer Empty">
            <img id="rotating-clock" src="${ROTATING_CLOCK}" alt="Rotating Clock">
            <div id="timer-full-container">
                <img id="timer-full" src="${TIMER_FULL}" alt="Timer Full">
            </div>
        `;

        // Append to document body or parent
        document.body.appendChild(container);

        // Store references for further manipulation
        this.timeTickerElement = container;
        this.timerFullContainer = container.querySelector('#timer-full-container') as HTMLElement;
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
        this.timerFullContainer.style.width = "100%"; // Reset width on start
    }
    update(deltaTime) {
        if (this.startMyTimer && !this.isStoneDropped) {
            this.timer += deltaTime * 0.008;

            // Calculate the new width percentage for the timer
            const timerDepletion = Math.max(0, 100 - this.timer);
            this.timerFullContainer.style.width = `${timerDepletion}%`;

            if (timerDepletion < 5 && !this.isMyTimerOver) {
                this.playLevelEndAudioOnce ? this.audioPlayer.playAudio(AUDIO_TIMEOUT) : null;
                this.playLevelEndAudioOnce = false;
            }

            if (timerDepletion <= 0 && !this.isMyTimerOver) {
                this.isMyTimerOver = true;
                this.callback(true);
            }
        }
    }

    public handleStoneDrop(event) {
        this.isStoneDropped = true;
    }
    public handleLoadPuzzle(event) {
        this.playLevelEndAudioOnce = true;
        this.isStoneDropped = false;
        this.startTimer();

    }

    public dispose() {
        this.unregisterEventListener();
        this.timeTickerElement.remove();
    }

}