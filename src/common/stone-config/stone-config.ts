import { font } from "@common";
import { TimerTicking, Tutorial } from "@components";
import gameSettingsService from '@gameSettingsService';

/**
 * Performance optimized stone configuration class.
 * Uses time-based animation and position caching to improve rendering performance.
 */
export class StoneConfig {
    public x: number;
    public y: number;
    public origx: number;
    public origy: number;
    public text: string;
    public img: CanvasImageSource;
    public imageSize: number;
    public textFontSize: number;
    public canWidth: number;
    public canHeight: number;
    public canvasWidth: number;
    public canvasHeight: number;
    public imageCenterOffsetX: number;
    public imageCenterOffsetY: number;
    public context: CanvasRenderingContext2D;
    public tutorialInstance: Tutorial;
    public timerTickingInstance: TimerTicking;
    public frame: number = 0;
    public isDisposed: boolean = false;
    // Performance optimization: Use time-based animation for smoother movement
    private animationStartTime: number = 0;
    private animationDuration: number = 1500; // 1.5 second animation
    public scale = gameSettingsService.getDevicePixelRatioValue();
    constructor(context, canvasWidth, canvasHeight, stoneLetter, xPos, yPos, img, timerTickingInstance, tutorialInstance?) {
        this.x = xPos;
        this.y = yPos;
        this.origx = xPos;
        this.origy = yPos;
        this.canWidth = canvasWidth;
        this.canHeight = canvasHeight;
        this.tutorialInstance = tutorialInstance;
        this.text = stoneLetter;
        this.img = img;
        this.context = context;
        this.calculateImageAndFontSize();
        this.imageCenterOffsetX = this.imageSize / 2.3;
        this.imageCenterOffsetY = this.imageSize / 1.5;
        this.timerTickingInstance = timerTickingInstance;
    }

    public initialize() {
        this.frame = 0;
        this.isDisposed = false;
        this.animationStartTime = 0;
    }

    calculateImageAndFontSize() {
        const scaledWidth = Math.round(this.canWidth / this.scale); // (width multiplied by devicePixelRatio) / devicePixelRatio to get the original screen width.
        const scaledHeight = Math.round(this.canHeight / this.scale);
        if (
            this.context.measureText(this.text).width * 1.4 >
            scaledHeight / 9.5
        ) {
            this.imageSize = this.context.measureText(this.text).width * 1.1;
            this.textFontSize = (scaledHeight / 25);
            if (this.text.length >= 3 && this.origx < 50 && this.origx < scaledWidth / 2) {
                this.x = this.origx + 21;
            }
        } else {
            this.imageSize = (scaledHeight / 9.5);
            this.textFontSize = (scaledHeight / 20);
        }
    }

    getEase = (currentProgress: number, start: number, distance: number) => {
        return -distance / 2 * (Math.cos(Math.PI * currentProgress) - 1) + start;
    };

    /**
     * Performance optimization: Calculate position based on animation progress
     */
    getX = () => {
        if (this.frame >= 100) return this.x;
        return this.getEase(this.frame / 100, 0, this.x);
    }

    /**
     * Performance optimization: Calculate position based on animation progress
     */
    getY = () => {
        if (this.frame >= 100) return this.y;
        return this.getEase(this.frame / 100, 0, this.y);
    }

    adjustSize(shouldResize, num) {
        return shouldResize ? num * 1.25 : num;
    }

    /**
     * Performance optimized draw method
     * - Uses time-based animation for smooth movement
     * - Only applies effects when necessary
     */
    draw(deltaTime: number, shouldResize: boolean = false) {
        if (this.isDisposed || !this.img || !this.context) return;

        // Update animation based on actual time elapsed
        if (this.frame < 100) {
            if (this.animationStartTime === 0) {
                this.animationStartTime = performance.now();
            }
            const elapsed = performance.now() - this.animationStartTime;
            this.frame = Math.min(100, (elapsed / this.animationDuration) * 100);
        }

        const x = this.getX() - (shouldResize ? this.imageCenterOffsetX * 1.25 : this.imageCenterOffsetX);
        const y = this.getY() - (shouldResize ? this.imageCenterOffsetY * 1.25 : this.imageCenterOffsetY);
        const size = shouldResize ? this.imageSize * 1.25 : this.imageSize;

        // Only apply shadow effects when stone is being dragged
        if (shouldResize) {
            this.context.shadowColor = 'rgba(255, 255, 255, 1)';
            this.context.shadowBlur = 12;
            this.context.shadowOffsetX = 0;
            this.context.shadowOffsetY = 0;
        }

        // Draw the stone image
        this.context.drawImage(this.img, x, y, size, size);

        // Reset shadow effects and draw text
        this.context.shadowColor = 'transparent';
        this.context.shadowBlur = 0;
        this.context.fillStyle = "white";
        this.context.font = this.textFontSize + `px ${font}, monospace`;
        this.context.textAlign = "center";
        this.context.fillText(this.text, this.getX(), this.getY());

        if (this.tutorialInstance && this.frame >= 100) {
            this.tutorialInstance.draw(deltaTime, this.img, this.imageSize);
        }
    }

    /**
     * Properly dispose of stone resources to prevent memory leaks.
     * This is crucial for performance when playing consecutive levels.
     */
    public dispose() {
        this.isDisposed = true;
        this.img = null;
        this.context = null;
        this.tutorialInstance = null;
        this.timerTickingInstance = null;
        this.frame = 0;
    }

    /**
     * Reset stone position and state.
     * Used when stones need to return to their original position.
     */
    public reset() {
        this.x = this.origx;
        this.y = this.origy;
        this.isDisposed = false;
    }
}
