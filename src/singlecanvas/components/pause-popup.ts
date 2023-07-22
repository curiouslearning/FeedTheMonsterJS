import CancelButton from "../components/buttons/cancel-button";
import CloseButton from "../components/buttons/close-button";
import RetryButton from "../components/buttons/retry-button";
import { Game } from "../../scenes/game";
import { CLICK } from "../common/event-names";

export default class PausePopUp {
  public canvas: Game;
  public context: CanvasRenderingContext2D;
  public cancelButton: CancelButton;
  public retryButton: RetryButton;
  public closeButton: CloseButton;
  public imagesLoaded: boolean = false;
  public pop_up_image: any;

  public id: any;
  public callback: any;
  public switchToLevelSelection: any;
  public reloadScene: any;
  public gameplayData: any;

  constructor(
    canvas,
    callback,
    switchToLevelSelection,
    reloadScene,
    gameplayData
  ) {
    this.canvas = canvas;
    this.callback = callback;
    this.gameplayData = gameplayData;
    this.switchToLevelSelection = switchToLevelSelection;
    this.reloadScene = reloadScene;
    // this.levelStart = levelStart;
    // this.canvasStack = new CanvasStack("canvas");
    // this.createCanvas();
    const selfIdElement = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement;
    this.context = selfIdElement.getContext("2d");

    this.cancelButton = new CancelButton(this.context, this.canvas);
    this.retryButton = new RetryButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.55,
      this.canvas.height * 0.2 +
      this.canvas.width * 0.4 -
      (this.canvas.width * 0.19) / 2
    );
    this.closeButton = new CloseButton(
      this.context,
      this.canvas,
      this.canvas.width * 0.25,
      this.canvas.height * 0.2 +
      this.canvas.width * 0.4 -
      (this.canvas.width * 0.19) / 2
    );
    var pop_up_image = new Image();
    pop_up_image.src = "./assets/images/popup_bg_v01.png";
    pop_up_image.onload = (e) => {
      this.pop_up_image = pop_up_image;
      this.imagesLoaded = true;
    };

    // this.createCanvas();
  }

  addListner = () => {
    document
      .getElementById("canvas")
      .addEventListener(CLICK, this.handleMouseClick, false);
  };

  handleMouseClick = (event) => {
    const selfElement = <HTMLElement>document.getElementById("canvas");
    event.preventDefault();
    var rect = selfElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.cancelButton.onClick(x, y)) {
      console.log(" cancel button clicked");
      this.callback();
    }
    if (this.retryButton.onClick(x, y)) {
      this.dispose();
      console.log(" retry button clicked");
      this.reloadScene(this.gameplayData);
    }
    if (this.closeButton.onClick(x, y)) {
      this.dispose();
      console.log(" close button clicked");
      this.switchToLevelSelection();
    }
  };

  // createCanvas() {
  //     var self = this;
  //     const selfIdElement = document.getElementById("canvas") as HTMLCanvasElement;
  //     selfIdElement.addEventListener("click", function (event) {
  //         var rect = selfIdElement.getBoundingClientRect();
  //         const x = event.clientX - rect.left;
  //         const y = event.clientY - rect.top;
  //         if (self.cancelButton.onClick(x, y)) {
  //             // this.levelStart.timerTicking.resumeTimer();
  //             // this.levelStart.levelEndCallBack('cancel_button');
  //             // this.deleteCanvas(this);
  //         }
  //         if (self.retryButton.onClick(x, y)) {
  //             // this.levelStart.levelEndCallBack("retry_button");
  //             // this.deleteCanvas(this);
  //         }
  //         if (self.closeButton.onClick(x, y)) {
  //             // this.levelStart.levelEndCallBack("close_button");
  //             // this.deleteCanvas(this);
  //         }
  //     }, false);
  // }

  deleteCanvas(this) { }

  draw() {
    if (this.imagesLoaded) {
      this.context.fillStyle = "rgba(0,0,0,0.5)";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(
        this.pop_up_image,
        this.canvas.width * 0.1,
        this.canvas.height * 0.2,
        this.canvas.width * 0.8,
        this.canvas.width * 0.8
      );
      this.cancelButton.draw();
      this.retryButton.draw();
      this.closeButton.draw();
    }
  }

  update() { }

  dispose() {
    document
      .getElementById("canvas")
      .removeEventListener(CLICK, this.handleMouseClick, false);
  }
}
