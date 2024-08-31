import { PAUSE_BUTTON_IMAGE } from '../../constants';
export default class PauseButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    public canvas: { height: number };
    public imagesLoaded: boolean = false;
    public pause_button_image: HTMLImageElement;
    private btnSize: number;
    private orignalPos: {
        x: number;
        y: number
    };

    constructor(
        context: CanvasRenderingContext2D,
        canvas: { width?: number; height: number }
    ) {
        this.posX = canvas.width - canvas.height * 0.09;
        this.posY = 0;
        this.context = context;
        this.canvas = canvas;
        this.pause_button_image = new Image();
        this.pause_button_image.src = PAUSE_BUTTON_IMAGE;
        this.pause_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.pause_button_image = this.pause_button_image;
        }
        this.btnSize = 0.09;
        this.orignalPos = { x: this.posX, y: this.posY };
    }

    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.pause_button_image,
                this.posX,
                this.posY,
                this.canvas.height * this.btnSize,
                this.canvas.height * this.btnSize
            );

            if (this.btnSize < 0.09) {
                this.btnSize = this.btnSize + 0.0005;
            } else {
                this.posX = this.orignalPos.x;
                this.posY = this.orignalPos.y;
            }
        }
    }

    onClick(xClick: number, yClick: number): boolean {
        const distance = Math.sqrt(
            (xClick - this.posX - (this.canvas.height * 0.09) / 2) *
            (xClick - this.posX - (this.canvas.height * 0.09) / 2) +
            (yClick - this.posY - (this.canvas.height * 0.09) / 2) *
            (yClick - this.posY - (this.canvas.height * 0.09) / 2)
        );

        if (distance < (this.canvas.height * 0.09) / 2) {
            this.btnSize = 0.08;
            this.posX = this.posX + 1;
            this.posY = this.posY + 1;

            return true;
        }
    }
}
