import { font } from "@common";
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
    public imageCenterOffsetX: number;
    public imageCenterOffsetY: number;
    public context: CanvasRenderingContext2D;
    public frame: number = 0;
    public isDisposed: boolean = false;
    // Performance optimization: Use time-based animation for smoother movement
    private animationStartTime: number = 0;
    private animationDuration: number = 1500; // 1.5 second animation
    public scale = gameSettingsService.getDevicePixelRatioValue();
    constructor(context, canvasWidth, canvasHeight, stoneLetter, xPos, yPos, img) {
        this.x = xPos;
        this.y = yPos;
        this.origx = xPos;
        this.origy = yPos;
        this.canWidth = canvasWidth;
        this.canHeight = canvasHeight;
        this.text = stoneLetter;
        this.img = img;
        this.context = context;
        this.calculateImageAndFontSize();
        this.imageCenterOffsetX = this.imageSize / 2.3;
        this.imageCenterOffsetY = this.imageSize / 1.5;
    }

    public initialize() {
        this.frame = 0;
        this.isDisposed = false;
        this.animationStartTime = 0;
    }

    calculateImageAndFontSize() {
        const scaledHeight = Math.round(this.canHeight / this.scale);

        const baseStoneSize = scaledHeight / 9.5;
        this.imageSize = baseStoneSize;

        let fontSize = scaledHeight / 20;
        // Cap by stone height so we never start larger than the drawable area
        const maxFontByHeight = this.imageSize * 0.5; // tweak
        fontSize = Math.min(fontSize, maxFontByHeight);

        // Scaled minimum (never below 14)
        const minFontSize = Math.max(14, this.imageSize * 0.28); // tweak % as needed

        const font = 'sans-serif';

        // Measure & shrink by width
        const fitRatio = 0.6; // target: use 60% of stone width
        this.context.font = `${fontSize}px ${font}`;
        let textWidth = this.context.measureText(this.text).width;

        while (textWidth > this.imageSize * fitRatio && fontSize > minFontSize) {
            fontSize -= 1;
            this.context.font = `${fontSize}px ${font}`;
            textWidth = this.context.measureText(this.text).width;
        }

        this.textFontSize = fontSize;
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
    draw(shouldResize: boolean = false) {
        if (this.isDisposed || !this.img || !this.context) return;

        // Update animation based on actual time elapsed
        if (this.frame < 100) {
            if (this.animationStartTime === 0) {
                this.animationStartTime = performance.now();
            }
            const elapsed = performance.now() - this.animationStartTime;
            this.frame = Math.min(100, (elapsed / this.animationDuration) * 100);
        }
        //shouldResize is used when stone letters are grouped together when playing word puzzle game types.
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
    }

    /**
     * Properly dispose of stone resources to prevent memory leaks.
     * This is crucial for performance when playing consecutive levels.
     */
    public dispose() {
        this.isDisposed = true;
        this.img = null;
        this.context = null;
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
