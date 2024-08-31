import { RETRY_BTN_IMAGE } from '../../constants';

export default class RetryButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;
    public imagesLoaded: boolean = false;
    public retry_button_image: HTMLImageElement;
    private btnSize: number;
    private orignalPos: {
        x: number;
        y: number
    };

    constructor(
        context: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        posX: number,
        posY: number
    ) {
        this.posX = posX;
        this.posY = posY;
        this.context = context;
        this.canvas = canvas;
        this.retry_button_image = new Image();
        this.retry_button_image.src = RETRY_BTN_IMAGE;
        this.retry_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.retry_button_image = this.retry_button_image;
        }
        this.btnSize = 0.19;
        this.orignalPos = { x: posX, y: posY };
    }

    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.retry_button_image,
                this.posX,
                this.posY,
                this.canvas.width * this.btnSize,
                this.canvas.width * this.btnSize
            );
            if (this.btnSize < 0.19) {
                this.btnSize = this.btnSize + 0.0005;
            } else {
                this.posX = this.orignalPos.x;
                this.posY = this.orignalPos.y;
            }
        }
    }

    onClick(xClick: number, yClick: number): boolean {
        const distance = Math.sqrt(
            (xClick - this.posX - (this.canvas.width * 0.19) / 2) *
            (xClick - this.posX - (this.canvas.width * 0.19) / 2) +
            (yClick - this.posY - (this.canvas.width * 0.19) / 2) *
            (yClick - this.posY - (this.canvas.width * 0.19) / 2)
        );

        if (distance < (this.canvas.width * 0.19) / 2) {
            this.btnSize = 0.18;
            this.posX = this.posX + 1;
            this.posY = this.posY + 1;

            return true;
        }
    }
}
