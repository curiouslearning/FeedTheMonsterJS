export default class PauseButton {
    public layoutMetricX: {
        width: number;
        height: number;
        multiplier: number;
    };
    public posY: number;
    public context: CanvasRenderingContext2D;
    public canvas: { height: number };
    public imagesLoaded: boolean = false;
    public pause_button_image: HTMLImageElement;
    private btnSize: number;

    constructor(
        context: CanvasRenderingContext2D,
        canvas: { width?: number; height: number }
    ) {
        this.layoutMetricX = {
            width: canvas.width,
            height: canvas.height,
            multiplier: 0.09
        };
        this.posY = 0;
        this.context = context;
        this.canvas = canvas;
        this.pause_button_image = new Image();
        this.pause_button_image.src = "./assets/images/pause_v01.png";
        this.pause_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.pause_button_image = this.pause_button_image;
        }
        this.btnSize = 0.09;
    }

    draw() {
        if (this.imagesLoaded) {
            const posX = this.getPosX();
            this.context.drawImage(
                this.pause_button_image,
                posX,
                this.posY,
                this.canvas.height * this.btnSize,
                this.canvas.height * this.btnSize
            );

            if (this.btnSize < 0.09) {
                this.btnSize = this.btnSize + 0.0005;
            } else {
                this.layoutMetricX.multiplier = 0.09;
            }
        }
    }

    onClick(xClick: number, yClick: number): boolean {
        const posX = this.getPosX();
        const distance = Math.sqrt(
            (xClick - posX - (this.canvas.height * 0.09) / 2) *
            (xClick - posX - (this.canvas.height * 0.09) / 2) +
            (yClick - this.posY - (this.canvas.height * 0.09) / 2) *
            (yClick - this.posY - (this.canvas.height * 0.09) / 2)
        );

        this.btnSize = 0.08;
        this.layoutMetricX.multiplier = 0.088;

        if (distance < (this.canvas.height * 0.09) / 2) {
            return true;
        }
    }

    private getPosX = () => {
        return this.layoutMetricX?.width - this.layoutMetricX.height * this.layoutMetricX.multiplier
    }
}
