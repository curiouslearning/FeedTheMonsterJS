import {
  Debugger,
  font,
} from "@common";
import {
  SPECIAL_LEVELS,
} from "@constants";

export default class LevelBloonButton {
    private context: CanvasRenderingContext2D;
    private levelData: {
        x: number;
        y: number;
        index: number;
        isSpecial: boolean;
        balloonImg: any;
        lockImg: any;
        starImg: any;
    }
    public posX: number;
    public posY: number;
    private originalPosX: number;
    private originalPosY: number;
    private size: number;
    private radiusOffSet: number;
    private bloonSize: number;
    private btnSize: number;
    private lockSize: number;
    private textFontSize: number;
    private pulse: boolean;
    private isSpecial: boolean;

    constructor(
        canvas,
        context,
        levelData,
    ) {
        this.context = context;
        this.levelData = levelData;
        this.posX = this.levelData.x;
        this.posY = this.levelData.y;
        this.originalPosX = this.posX;
        this.originalPosY = this.posY;
        this.size = canvas.height / 5;
        this.radiusOffSet = canvas.height / 20;
        this.bloonSize = this.isLevelSpecial(this.size);
        this.btnSize = this.bloonSize;
        this.lockSize = canvas.height / 13;
        this.textFontSize = (this.size) / 6;
        this.pulse = false;
        this.isSpecial = false;
    }

    setPulse(shouldPulse: boolean, isSpecial: boolean) {
        this.pulse = shouldPulse;
        this.isSpecial = isSpecial;
    }

    isSpecialLevel(index){
        return SPECIAL_LEVELS.includes(index)
    };

    isLevelSpecial(size) {
        return this.levelData?.isSpecial
            ? size * 0.9
            : size;
    }

    draw(
        levelSelectionPageIndex,
        unlockLevelIndex,
        gameLevelData,
        totalGameLevels
    ) {
        if (this.pulse) {
            this.applyPulseEffect();
        }

        this.context.drawImage(
            this.levelData?.balloonImg,
            this.posX,
            this.posY,
            this.btnSize,
            this.btnSize
        );

        this.context.fillStyle = "white";
        this.context.font = this.textFontSize + `px ${font}, monospace`;
        this.context.textAlign = "center";
        this.context.fillText(
            `${this.levelData.index + levelSelectionPageIndex}`,
            this.levelData.x + this.size / 3.5,
            this.levelData.y + this.size / 3
        );
        this.context.font = this.textFontSize - (this.size) / 30 + `px ${font}, monospace`;

        if (this.btnSize < this.bloonSize) {
            this.btnSize = this.btnSize + 0.50;
        } else {
            this.btnSize = this.bloonSize;
            this.posX = this.levelData.x;
            this.posY = this.levelData.y;
        }

        this.drawIcons(
            levelSelectionPageIndex,
            unlockLevelIndex,
            gameLevelData,
            totalGameLevels
        );
    }

    private applyPulseEffect() {
        const PulseDuration = 1500;
        const GrowPhaseThreshold = 0.7;
        const BaseShadowSize = 15;
        const MaxShadowSize = 45;
        const MaxOpacity = 0.5;
        const BaseColorRgba = '255, 255, 255';
      
        const animationProgress = (Date.now() % PulseDuration) / PulseDuration;
        const growPhase = animationProgress <= GrowPhaseThreshold;
      
        const phaseDuration = growPhase ? GrowPhaseThreshold : (1 - GrowPhaseThreshold);
        const progress = growPhase ? animationProgress / GrowPhaseThreshold : (animationProgress - GrowPhaseThreshold) / phaseDuration;
      
        const shadowSize = growPhase ? progress * BaseShadowSize : BaseShadowSize + progress * MaxShadowSize;
        const shadowOpacity = growPhase ? MaxOpacity * (1 - progress) : 0;
      
        if (shadowOpacity <= 0) return;
      
        const { x: scaleX, y: scaleY, radius: scaleRadius } = this.levelData?.isSpecial 
          ? { x: 3, y: 2.5, radius: 2.2 } 
          : { x: 3.4, y: 3.8, radius: 3.2 };
      
        const centerX = this.posX + this.btnSize / scaleX;
        const centerY = this.posY + this.btnSize / scaleY;
        const radius = this.btnSize / scaleRadius + shadowSize;
      
        this.context.save();
        this.context.beginPath();
        this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.context.fillStyle = `rgba(${BaseColorRgba}, ${shadowOpacity})`;
        this.context.fill();
        this.context.restore();
    }

    drawIcons(
        pageIndex,
        unlockLevelIndex,
        gameLevelData,
        totalGameLevels
    ) {
        const index = this.levelData.index;
        if (!Debugger.DebugMode) {
            (index + pageIndex - 1 > unlockLevelIndex + 1) && this.drawLock();
        }

        if (gameLevelData.length && index + pageIndex <= totalGameLevels) {
          for (let i = 0; i < gameLevelData.length; i++) {
            if (
              index - 1 + pageIndex ===
              parseInt(gameLevelData[i].levelNumber)
            ) {
              this.checkStars(
                gameLevelData[i].starCount
              );
              break;
            }
          }
        }
    }

    drawLock() {
        this.context.drawImage(
            this.levelData?.lockImg,
            this.levelData.x,
            this.levelData.y,
            this.lockSize,
            this.lockSize
        );
    }

    checkStars(starCount) {
        const posX = this.levelData.x;
        const posY = this.levelData.y;
        const size = this.size;

        if (starCount >= 1) {
            this.drawStar(posX, posY - size * 0.01);
        }

        if (starCount > 1) {
            this.drawStar(
                posX + size / 2.5,
                posY - size * 0.01
            );
        }

        if (starCount === 3) {
            this.drawStar(
                posX + size  / 5,
                posY - size *  0.1
            );
        }
    }

    drawStar(posX, posY) {
        this.context.drawImage(
            this.levelData?.starImg,
            posX,
            posY,
            this.size / 5,
            this.size / 5
        );
    }

    onClick(
        xClick: number,
        yClick: number,
        levelSelectionPageIndex: number,
        unlockLevelIndex: number,
        callBack
    ) {
        const distance =  Math.sqrt(
            (xClick -  this.levelData.x - this.radiusOffSet) *
            (xClick -  this.levelData.x - this.radiusOffSet) +
            (yClick -  this.levelData.y - this.radiusOffSet) *
            (yClick -  this.levelData.y - this.radiusOffSet)
        )
        if (distance < 45) {
            if (Debugger.DebugMode || (
                this.levelData.index + levelSelectionPageIndex <= unlockLevelIndex
            )) {
                this.btnSize = this.bloonSize - 4;
                this.posX = this.originalPosX + 0.5;
                this.posY = this.originalPosY + 1;
                
                callBack(this.levelData.index)
            }
      }
    }
}