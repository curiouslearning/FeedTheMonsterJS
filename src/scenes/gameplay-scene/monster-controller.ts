import { MONSTER_PHASES } from "@constants";
import { RiveMonsterComponent } from '@components/riveMonster/rive-monster-component';
import gameSettingsService from '@gameSettingsService';
import gameStateService from '@gameStateService';

export class MonsterController {
  // #region Properties
  private monster: RiveMonsterComponent;
  private monsterPhaseNumber: 0 | 1 | 2 | 3;
  private scale: number;
  private hitboxRangeX: { from: number; to: number };
  private hitboxRangeY: { from: number; to: number };

  private animationDelays = [
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1500, isSad: 3000 },
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1000, isSad: 2500 },
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1300, isSad: 2600 },
    { backToIdle: 350, isChewing: 0, isHappy: 1700, isSpit: 1500, isSad: 3000 }
  ];
  // #endregion

  constructor(private riveCanvas: HTMLCanvasElement, phase: 0 | 1 | 2 | 3 = 3) {
    this.monsterPhaseNumber = phase;
    this.scale = gameSettingsService.getDevicePixelRatioValue();
    this.initMonster();
    this.initializeHitbox();
  }

  // #region Lifecycle
  private initMonster() {
    if (this.monster) {
      this.monster.dispose();
    }
    this.monster = new RiveMonsterComponent({
      canvas: this.riveCanvas,
      autoplay: true,
      fit: "contain",
      alignment: "bottomCenter",
      src: MONSTER_PHASES[this.monsterPhaseNumber],
    });
  }

  public resetForNextPuzzle() {
    this.initMonster();
  }

  public dispose() {
    if (this.monster) {
      this.monster.dispose();
      this.monster = null;
    }
  }
  // #endregion

  // #region Animation API
  public playSuccessAnimation() {
    this.triggerMonsterAnimation('isChewing');
    this.triggerMonsterAnimation('isHappy');
  }

  public playFailureAnimation() {
    this.triggerMonsterAnimation('isChewing');
    this.triggerMonsterAnimation('isSpit');
    this.triggerMonsterAnimation('isSad');
  }

  public triggerMonsterAnimation(animationName: string) {
    const delay = this.animationDelays[this.monsterPhaseNumber]?.[animationName] ?? 0;
    if (delay > 0) {
      setTimeout(() => this.monster?.triggerInput(animationName), delay);
    } else {
      this.monster?.triggerInput(animationName);
    }
  }
  // #endregion

  // #region Interaction & Hitbox
  public checkHitbox(x: number, y: number): boolean {
    return x >= this.hitboxRangeX.from && x <= this.hitboxRangeX.to &&
           y >= this.hitboxRangeY.from && y <= this.hitboxRangeY.to;
  }

  public onClick(x: number, y: number): boolean {
    return this.checkHitbox(x, y);
  }

  /**
   * Call this in a draw method in gameplay-scene. FOR TESTING ONLY.
   * @param context 
   */
  public createHitboxOverlayForTesting(context: CanvasRenderingContext2D) {
    const width = this.hitboxRangeX.to - this.hitboxRangeX.from;
    const height = this.hitboxRangeY.to - this.hitboxRangeY.from;

    context.fillStyle = 'rgba(0, 128, 255, 0.5)';
    context.fillRect(this.hitboxRangeX.from, this.hitboxRangeY.from, width, height);

    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.strokeRect(this.hitboxRangeX.from, this.hitboxRangeY.from, width, height);
  }

  private initializeHitbox() {
    const logicalCanvasWidth = this.riveCanvas.width / this.scale;
    const logicalCanvasHeight = this.riveCanvas.height / this.scale;
    const aspectRatio = window.innerWidth / window.innerHeight;

    const breakpoints = [
      { max: 0.4, bottomY: 0.78, height: 0.28 },
      { max: 0.5, bottomY: 0.82, height: 0.32 },
      { max: 0.6, bottomY: 0.85, height: 0.35 },
      { max: 0.7, bottomY: 0.84, height: 0.36 },
      { max: 0.8, bottomY: 0.88, height: 0.38 },
    ];

    const defaultValues = { bottomY: 0.90, height: 0.40 };
    const { bottomY, height } = breakpoints.find(b => aspectRatio < b.max) || defaultValues;

    const monsterBottomY = logicalCanvasHeight * bottomY;
    const monsterHeight = logicalCanvasHeight * height;
    const monsterTopY = monsterBottomY - monsterHeight;

    const hitboxOffsetY = monsterHeight * 0.05;
    const hitboxPaddingY = monsterHeight * 0.1;

    this.hitboxRangeX = {
      from: logicalCanvasWidth * 0.35,
      to: logicalCanvasWidth * 0.65,
    };

    this.hitboxRangeY = {
      from: monsterTopY + hitboxPaddingY + hitboxOffsetY,
      to: monsterBottomY - hitboxPaddingY + hitboxOffsetY,
    };

    gameStateService.saveHitBoxRanges({ hitboxRangeX: this.hitboxRangeX, hitboxRangeY: this.hitboxRangeY });
  }
  // #endregion

  // #region Getters
  public getRiveInstance() {
    return this.monster;
  }

  public get currentPhase(): number {
    return this.monsterPhaseNumber;
  }
  // #endregion
}