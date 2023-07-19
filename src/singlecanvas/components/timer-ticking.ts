import { loadImages } from "../../common/common";
import { EventManager } from "../events/EventManager";

declare global {
    interface Window {
        Android?: any;
    }
}
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
    public canavsElement: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;
    public timer_full: HTMLImageElement;
    public pauseButtonClicked: boolean;
    public id: string;
    public fps: any;
    public frameInterval: any;
    public frameTimer: any;
    public images: Object;
    public loadedImages: any;
    public callback: any;
    public imagesLoaded: boolean = false;
    public startMyTimer: boolean = true;
    public isMyTimerOver: boolean = false;
    // public isAnswerDropped: boolean = false;
    public isStoneDropped: boolean = false;

    constructor(width: any, height: any, callback: any) {
        super({
            stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
            loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event)
        })
        this.width = width;
        this.height = height;
        this.widthToClear = this.width / 3.4;
        this.timerHeight = 112;
        this.timerWidth = 888;
        this.callback = callback;
        this.canavsElement = document.getElementById("canvas") as HTMLCanvasElement;
        this.context = this.canavsElement.getContext("2d");
        this.timer = 0;
        this.isTimerStarted = false;
        this.isTimerEnded = false;
        this.isTimerRunningOut = false;
        var self = this;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;

        this.images = {
            timer_empty: "./assets/images/timer_empty.png",
            rotating_clock: "./assets/images/timer.png",
            timer_full: "./assets/images/timer_full.png"
        }

        loadImages(this.images, (images) => {
            this.loadedImages = Object.assign({}, images);
            this.imagesLoaded = true;
        });
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
    }
    update(deltaTime) {
        if (this.startMyTimer && !this.isStoneDropped) {
            this.timer += deltaTime * 0.008;
        }
        if ((this.width * 0.87 - (this.width * 0.87 * this.timer * 0.01)) < 0 && !this.isMyTimerOver) {
            this.isMyTimerOver = true;
            this.callback(true);
        }
    }

    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.loadedImages.timer_empty,
                0,
                this.height * 0.1,
                this.width,
                this.height * 0.05
            );
            this.context.drawImage(
                this.loadedImages.rotating_clock,
                5,
                this.height * 0.09,
                this.width * 0.12,
                this.height * 0.06
            );
            this.context.drawImage(
                this.loadedImages.timer_full,
                0,
                0,
                this.timerWidth - (this.timerWidth * this.timer * 0.01),
                this.timerHeight,
                this.width * 0.14,
                this.height * 0.099,
                this.width * 0.87 - (this.width * 0.87 * this.timer * 0.01),
                this.height * 0.05
            );
        }
    }

    public handleStoneDrop(event) {
        this.isStoneDropped = true;
    }
    public handleLoadPuzzle(event) {
        this.isStoneDropped = false;
        this.startTimer();

    }

    public dispose() {
        this.unregisterEventListener();
    }

}
