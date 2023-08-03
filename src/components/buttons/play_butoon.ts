
var pause_button_image = new Image();
pause_button_image.src = "./assets/images/Play_button.png";
export default class PlayButton {
  public posX: number;
  public posY: number;
  public context: CanvasRenderingContext2D;
  public canvas: { width: number; height: number };

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

    var self = this;
    // this.draw();
  }
  draw() {
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // pause_button_image.onload = (e)=> {
    this.context.drawImage(
      pause_button_image,
      this.posX,
      this.posY,
      this.canvas.width / 3,
      this.canvas.width / 3
    );
    // };
  }
  onClick(xClick: number, yClick: number) {
    const distance = Math.sqrt(
      (xClick - this.posX - this.canvas.width / 6) *
      (xClick - this.posX - this.canvas.width / 6) +
      (yClick - this.posY - this.canvas.width / 6) *
      (yClick - this.posY - this.canvas.width / 6)
    );

    if (distance < this.canvas.width / 8) {
      return true;
    }
  }
}
