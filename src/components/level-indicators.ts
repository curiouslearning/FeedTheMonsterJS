export class LevelIndicators {
  public context: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;
  public activeIndicators: number;

  constructor(context, canvas, activeIndicators) {
    this.context = context;
    this.canvas = canvas;
    this.activeIndicators = activeIndicators;
    this.draw();
  }
  setIndicators(int) {
    this.activeIndicators = int;
    this.update(this);
  }
  draw() {
    var self = this;

    var level_indicator = new Image();
    level_indicator.src = "./assets/images/levels_v01.png";
    var bar_empty = new Image();
    bar_empty.src = "./assets/images/bar_empty_v01.png";

    level_indicator.onload = function (e) {
      self.context.drawImage(
        level_indicator,
        self.canvas.width * 0.15,
        0,
        self.canvas.width * 0.35,
        self.canvas.height * 0.09
      );
      bar_empty.onload = function (e) {
        for (var i = 0; i < 5; i++) {
          self.context.drawImage(
            bar_empty,
            ((self.canvas.width * 0.35) / 7) * (i + 1) +
              self.canvas.width * 0.15,
            (self.canvas.height * 0.09) / 2 - (self.canvas.height * 0.09) / 6,
            (self.canvas.width * 0.35) / 10,
            (self.canvas.height * 0.09) / 3
          );
        }
      };
      self.update(self);
    };
  }
  update(self) {
    var bar_full = new Image();
    bar_full.src = "./assets/images/bar_full_v01.png";
    bar_full.onload = function (e) {
      for (var i = 0; i < self.activeIndicators; i++) {
        self.context.drawImage(
          bar_full,
          ((self.canvas.width * 0.35) / 7) * (i + 1) + self.canvas.width * 0.15,
          (self.canvas.height * 0.09) / 2 - (self.canvas.height * 0.09) / 6,
          (self.canvas.width * 0.35) / 10,
          (self.canvas.height * 0.09) / 3
        );
      }
    };
  }
}
