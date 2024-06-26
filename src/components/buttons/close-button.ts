
export default class CloseButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    public canvas: HTMLCanvasElement;
    public imagesLoaded: boolean = false;
    public close_button_image: HTMLImageElement;

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
        this.close_button_image = new Image();
        this.close_button_image.src = "./assets/images/map_btn.png";
        this.close_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.close_button_image = this.close_button_image;
        }
    }
    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.close_button_image,
                this.posX,
                this.posY,
                this.canvas.width * 0.19,
                this.canvas.width * 0.19
            );
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
            return true;
        }
    }
}
