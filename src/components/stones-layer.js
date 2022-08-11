import { StoneConfig } from "../common/stones-config.js";
import { CanvasStack } from "../utility/canvas-stack.js";
import PauseButton from "./buttons/pause_button.js";


var gs = {
  mode: "gameplay",
  levelnum: 0,
};
gs.puzzle = {
  puzzlenum: 0,
  target: "e",
  stones: ["e", "d","a","b","c","f","g","h" ],
};
gs.stones = [];
var pickedStone;
export default class StonesLayer {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height - canvas.width * 0.2;
    this.canvasStack = new CanvasStack("canvas");
    this.createCanvas();
  }

  createCanvas() {
    this.id = this.canvasStack.createLayer(this.height, this.width);
    this.context = document.getElementById(this.id).getContext("2d");
    document.getElementById(this.id).style.zIndex = 10;
    document.getElementById(this.id).style.bottom = 0;
    this.stonepos=[
      [
        [this.canvas.width/7,this.canvas.height/1.9],
        [this.canvas.width/2,this.canvas.height/1.32],
        [this.canvas.width/3.5+this.canvas.width/2,this.canvas.height/1.2],
        [this.canvas.width/4,this.canvas.height/1.28],
        [this.canvas.width/7,this.canvas.height/1.5],
        [this.canvas.width/2.3+this.canvas.width/2.1,this.canvas.height/1.9],
        [this.canvas.width/2.3+this.canvas.width/2.1,this.canvas.height/1.42],
        [this.canvas.width/6,this.canvas.height/1.2],

      ],
    ];
    document.getElementById(this.id).addEventListener(
      "mousedown",
      function (event) {
        var rect = document.getElementById(this.id).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;       
        for (let s of gs.stones) {
          if (Math.sqrt((x - s.x) * (x - s.x) + (y - s.y) * (y - s.y)) <= 32) {
            pickedStone = s;
          }
        }
      },
      false
    );
    document.getElementById(this.id).addEventListener(
      "mouseup",
      function (event) {
        var rect = document.getElementById(this.id).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top; 
        if (
          Math.sqrt(
            (x - this.width * 0.38 - 300) * (x - this.width * 0.38 - 300) +
              (y - this.height * 0.3 - 200) * (y - this.height * 0.3 - 200)
          ) <= 150
        ) {
          pickedStone.x = -900;
          pickedStone.y = -900;
          pickedStone = null
        }
        if (pickedStone) {
          pickedStone.x = pickedStone.origx;
          pickedStone.y = pickedStone.origy;
        }
        pickedStone = null;
      },
      false
    );
    document.getElementById(this.id).addEventListener(
      "mousemove",
      function (event) {
        var rect = document.getElementById(this.id).getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (pickedStone) {
          pickedStone.x = x;
          pickedStone.y = y;
        }
      },
      false
    );

    document.getElementById(this.id).addEventListener(
      "touchstart",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        document.getElementById(this.id).dispatchEvent(mouseEvent);
      },
      false
    );

    document.getElementById(this.id).addEventListener(
      "touchmove",
      function (e) {
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        document.getElementById(this.id).dispatchEvent(mouseEvent);
      },
      false
    );

    document.getElementById(this.id).addEventListener(
      "touchend",
      function (e) {
        var touch = e.changedTouches[0];
        var mouseEvent = new MouseEvent("mouseup", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        document.getElementById(this.id).dispatchEvent(mouseEvent);
      },
      false
    );


    this.createStones(this.stonepos);
  }

  deleteCanvas() {}

  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let s of gs.stones) {
      this.drawstone(s);
    }
  }

  drawstone(s) {
    this.context.drawImage(s.img, s.x - 32, s.y - 32, 64, 64);
    this.context.fillStyle = "white";
    this.context.font = "20px Arial";
    this.context.fillText(s.text, s.x - 9, s.y + 8);
  }

  createStones(stonepos) {
    var poss = stonepos[0];
    var i = 0;
    for (let s of gs.puzzle.stones) {
      console.log(poss[i][0]);
      var ns = new StoneConfig(s, poss[i][0], poss[i][1]);
      // pickedStone = ns;
      gs.stones.push(ns);
      i += 1;
    }
    this.draw();
  }

  update() {
    this.draw();
    // this.pauseButton.draw();
  }
}
