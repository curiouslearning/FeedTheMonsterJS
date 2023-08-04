import { CanvasStack } from "../utility/canvas-stack";
import {
  GameEndLayer,
  loadImages
} from "../common/common";
import { Game } from "./game";

var images = {
  bgImg: "./assets/images/bg_v01.jpg",
  hillImg: "./assets/images/hill_v01.png",
  timer_empty: "./assets/images/timer_empty.png",
  pillerImg: "./assets/images/Totem_v02_v01.png",
  grassImg: "./assets/images/FG_a_v01.png",
  fenchImg: "./assets/images/fence_v01.png",
  bigMonsterImg: "./assets/images/ftm_bonus_level_monsters.png"
};
var self;

// scene to show after end of 150 evels
export class GameEndScene {
  public game: Game;
  public width: number;
  public height: number;
  public canvasStack: any;
  public id: string;
  public canavsElement: HTMLCanvasElement;
  public context: any;

  constructor(game: Game) {
    this.game = game;
    this.width = game.width;
    this.height = game.height;
    self = this;
    this.canvasStack = new CanvasStack("canvas");
    this.createCanvas();
  }

  createCanvas() {
    this.id = this.canvasStack.createLayer(
      this.height,
      this.width,
      GameEndLayer
    );
    this.canavsElement = (document.getElementById(this.id) as HTMLCanvasElement);
    this.context = this.canavsElement.getContext("2d");
    this.canavsElement.style.zIndex = '3';
    (document.getElementById("discription-text") as HTMLElement).style.display = "block";
    (document.getElementById("discription-text") as HTMLElement).innerHTML = globalThis.descriptionText;
    this.createBackgroud()
  }

  deleteCanvas() {
    (document.getElementById("discription-text") as HTMLElement).style.display = "none";
    this.canvasStack.deleteLayer(this.id);
    //delete this;
  }

  draw() {

  }

  createBackgroud() {
    var self = this;
    var context = this.context;
    var width = this.width;
    var height = this.height;
    loadImages(images, function (image) {
      context.drawImage(image.bgImg, 0, 0, width, height);
      context.drawImage(
        image.pillerImg,
        width * 0.6,
        height / 6,
        width,
        height / 2
      );
      context.drawImage(
        image.fenchImg,
        -width * 0.4,
        height / 3,
        width,
        height / 3
      );
      context.drawImage(
        image.hillImg,
        -width * 0.25,
        height / 2,
        width * 1.5,
        height / 2
      );
      context.drawImage(
        image.grassImg,
        -width * 0.25,
        height / 2 + (height / 2) * 0.1,
        width * 1.5,
        height / 2
      );

      context.drawImage(
        image.bigMonsterImg,
        width * 0.25,
        height / 2 - height * 0.25,
        width / 1.7,
        height / 2.5
      )
    });
  }
}