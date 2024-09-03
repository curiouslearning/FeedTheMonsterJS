import { NEXT_BTN_IMG } from "@constants";
export default class NextButton {
    public posX: number;
    public posY: number;
    public context: CanvasRenderingContext2D;
    public width: number;
    public height: number;
    public imagesLoaded: boolean = false;
    public next_button_image: HTMLImageElement;
    private btnSize: number;
    private orignalPos: {
        x: number;
        y: number
    };

    constructor(
        context: CanvasRenderingContext2D,
        width, height,
        posX: number,
        posY: number
    ) {
        this.posX = posX;
        this.posY = posY;
        this.context = context;
        this.width = width;
        this.height = height;
        this.next_button_image = new Image();
        this.next_button_image.src = NEXT_BTN_IMG;
        this.next_button_image.onload = (e) => {
            this.imagesLoaded = true;
            this.next_button_image = this.next_button_image;
        }
        this.btnSize = 0.19;
        this.orignalPos = { x: this.posX, y: this.posY };
    }
    draw() {
        if (this.imagesLoaded) {
            this.context.drawImage(
                this.next_button_image,
                this.posX,
                this.posY,
                this.width * this.btnSize,
                this.width * this.btnSize
            );
            if (this.btnSize < 0.19) {
                this.btnSize = this.btnSize + 0.0005;
            }  else {
                this.posX = this.orignalPos.x;
                this.posY = this.orignalPos.y;
            }
        }
    }
    onClick(xClick: number, yClick: number): boolean {
        const distance = Math.sqrt(
            (xClick - this.posX - (this.width * 0.19) / 2) *
            (xClick - this.posX - (this.width * 0.19) / 2) +
            (yClick - this.posY - (this.width * 0.19) / 2) *
            (yClick - this.posY - (this.width * 0.19) / 2)
        );
        if (distance < (this.width * 0.19) / 2) {
             this.btnSize = 0.18;
            this.posX = this.posX + 1;
            this.posY = this.posY + 1;
            return true;
        }
    }
}
