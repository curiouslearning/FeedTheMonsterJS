export default class CancelButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    public canvas: { width: any; height?: number };
    public imagesLoaded: boolean = false;
    public cancel_button_image: any;

    constructor(
        context: CanvasRenderingContext2D,
        canvas: { width: number; height?: number }
    ) {
        this.posX = canvas.width * 0.1 + (canvas.width * 0.15) / 2;
        this.posY = canvas.height * 0.2;
        this.context = context;
        this.canvas = canvas;

        var cancel_button_image = new Image();
        cancel_button_image.src = "./assets/images/close_btn.png";
        cancel_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.cancel_button_image = cancel_button_image;
        }
    }

    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.cancel_button_image,
                this.posX,
                this.posY,
                this.canvas.width * 0.15,
                this.canvas.width * 0.15
            );
        }
    }

    onClick(xClick, yClick) {
        const distance = Math.sqrt(
            (xClick - this.posX - (this.canvas.width * 0.15) / 2) *
            (xClick - this.posX - (this.canvas.width * 0.15) / 2) +
            (yClick - this.posY - (this.canvas.width * 0.15) / 2) *
            (yClick - this.posY - (this.canvas.width * 0.15) / 2)
        );
        if (distance < (this.canvas.width * 0.15) / 2) {
            return true;
        }
    }
}
