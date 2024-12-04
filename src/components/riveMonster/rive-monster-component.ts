import { Rive, Layout, Fit, Alignment } from '@rive-app/canvas';
import { EventManager } from '@events';

interface RiveMonsterComponentProps {
  canvas: HTMLCanvasElement;
  autoplay: boolean;
  fit?: string;
  alignment?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
}

export class RiveMonsterComponent extends EventManager {
  private props: RiveMonsterComponentProps;
  private riveInstance: any;
  private src: string = './assets/monsterrive.riv';
  private stateMachines: string = 'State Machine 1';

  public static readonly Animations = {
    OPENING_MOUTH_EAT: 'Opening Mouth Eat',
    EAT_HAPPY: 'Eat Happy',
    IDLE: 'Idle',
    EAT_DISGUST: 'Eat Disgust',
  };

  public zindex: number;
  public width: number;
  public height: number;
  public x: number;
  public y: number;
  public fps: number;
  public canvasElement: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public game: any;
  public monsterPhase: number;
  private hitboxRangeX: { from: number; to: number };
  private hitboxRangeY: { from: number; to: number };

  constructor(game?, monsterPhase?, callBackFunction?) {
    super({
      stoneDropCallbackHandler: (event) => this.handleStoneDrop(event),
      loadPuzzleCallbackHandler: (event) => this.handleLoadPuzzle(event),
    });

    this.game = game;
    this.monsterPhase = monsterPhase;
    this.width = this.game.width;
    this.height = this.game.height;
    this.canvasElement = document.getElementById('rivecanvas') as HTMLCanvasElement;
    this.context = this.canvasElement.getContext('2d');
    this.x = this.game.width / 2 - this.game.width * 0.243;
    this.y = this.game.width / 3;
    this.hitboxRangeX = { from: 0, to: 0 };
    this.hitboxRangeY = { from: 0, to: 0 };

    this.props = {
      canvas: this.canvasElement,
      autoplay: true,
      fit: 'contain',
      alignment: 'topCenter',
      width: this.canvasElement.width,
      height: this.canvasElement.height,
      onLoad: () => {
        this.play(RiveMonsterComponent.Animations.IDLE);
        this.drawHitbox(); // Ensure hitbox is drawn on load
      },
    };

    this.initializeRive();
    this.initializeHitbox();

    if (callBackFunction) {
      callBackFunction();
    }
  }

  private initializeRive() {
    this.riveInstance = new Rive({
      src: this.src,
      canvas: this.props.canvas,
      autoplay: this.props.autoplay,
      stateMachines: this.stateMachines,
      layout: new Layout({
        fit: Fit[this.props.fit || 'Contain'],
        alignment: Alignment[this.props.alignment || 'TopCenter'],
      }),
      onLoad: this.props.onLoad,
    });
  }

  private initializeHitbox() {
    const rangeFactorX = 70;
    const rangeFactorY = 50;
    const monsterCenterX = this.game.width / 2;
    const monsterCenterY = monsterCenterX / 2;

    this.hitboxRangeX.from = monsterCenterX - rangeFactorX;
    this.hitboxRangeX.to = monsterCenterX + rangeFactorX;
    this.hitboxRangeY.from = monsterCenterY - rangeFactorY;
    this.hitboxRangeY.to = monsterCenterY + rangeFactorY;

    console.log('Hitbox initialized:', {
      hitboxRangeX: this.hitboxRangeX,
      hitboxRangeY: this.hitboxRangeY,
    });

    this.drawHitbox();
  }

  public drawHitbox() {
    if (!this.context) {
      console.error('Canvas context is not initialized.');
      return;
    }

    const width = this.hitboxRangeX.to - this.hitboxRangeX.from;
    const height = this.hitboxRangeY.to - this.hitboxRangeY.from;

    // console.log('Drawing hitbox with dimensions:', { width, height });
    // console.log('this.hitboxRangeX.to:', this.hitboxRangeX.to);
    // console.log('this.hitboxRangeX.from:', this.hitboxRangeX.from);

    this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height); // Clear previous frame
    this.context.beginPath();
    this.context.strokeStyle = 'red';
    this.context.lineWidth = 2;
    this.context.rect(this.hitboxRangeX.from, this.hitboxRangeY.from, width, height);
    this.context.stroke();
    this.context.closePath();
  }

  play(animationName: string) {
    console.log(this.riveInstance);
    if (this.riveInstance) {
      console.log(animationName);
      this.riveInstance.play(animationName);
    }
  }

  stop() {
    if (this.riveInstance) {
      this.riveInstance.stop();
    }
  }

  checkHitboxDistance(event) {
    const rect = this.canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const isWithinHitboxX = x >= this.hitboxRangeX.from && x <= this.hitboxRangeX.to;
    const isWithinHitboxY = y >= this.hitboxRangeY.from && y <= this.hitboxRangeY.to;

    // return isWithinHitboxX && isWithinHitboxY;
    return true;
  }

  handleStoneDrop(event) {
    if (event.detail.isCorrect) {
      this.play(RiveMonsterComponent.Animations.EAT_HAPPY);
    } else {
      this.play(RiveMonsterComponent.Animations.EAT_DISGUST);
    }
  }

  handleLoadPuzzle(event) {
    this.play(RiveMonsterComponent.Animations.IDLE);
  }

  dispose() {
    this.stop();
    this.unregisterEventListener();
  }

  onClick(xClick: number, yClick: number): boolean {
    const distance = Math.sqrt(
      (xClick - this.x - this.width / 4) ** 2 +
        (yClick - this.y - this.height / 2.2) ** 2,
    );
    return distance <= 100;
  }
}
