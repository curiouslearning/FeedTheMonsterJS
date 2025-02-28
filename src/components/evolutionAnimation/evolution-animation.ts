import { BaseHTML } from '@components/baseHTML/base-html';
import { RiveMonsterComponent, RiveMonsterComponentProps } from '@components/riveMonster/rive-monster-component';
import { EVOL_MONSTER } from '@constants';
import gameStateService from '@gameStateService';

export interface EvolutionAnimationProps extends RiveMonsterComponentProps {
  monsterPhaseNumber: number;
  onComplete?: () => void;
}

const CANVAS_Z_INDEX_MAP = {
  evolution: {
    zIndex: '13',
  },
  normal: {
    zIndex: '4',
  }
};
export class EvolutionAnimationComponent extends RiveMonsterComponent {
  
  static shouldInitialize(): boolean {
    const { monsterPhaseNumber } = gameStateService.getLevelEndSceneData();
    const newPhase = gameStateService.checkMonsterPhaseUpdation();
    return newPhase > monsterPhaseNumber;
  }
  private backgroundElement: BaseHTML;
  protected evolutionProps: EvolutionAnimationProps;
  public monsterPhaseNumber: number;
  public evolveMonster: boolean;
  private readonly EVOLUTION_ANIMATION_COMPLETE_DELAY = 6500;
  private readonly EVOLUTION_ANIMATION_FADE_EFFECT_DELAY = 500;

  constructor(props: EvolutionAnimationProps) {
    const evolutionSrc = EvolutionAnimationComponent.getEvolutionSource(props.monsterPhaseNumber);
    super({
      ...props,
      src: evolutionSrc
    });
    
    this.evolutionProps = props;
    this.monsterPhaseNumber = gameStateService.checkMonsterPhaseUpdation();
    this.initialize();
    this.startAnimation();
  }

  private initialize() {
    this.initializeBackground();
    this.setCanvasPosition('evolution');
  }

  private initializeBackground() {
    this.backgroundElement = new BaseHTML(
      {
        selectors: { root: '#background' }
      },
      'levelend-background',
      (id) => (`<div id="${id}"></div>`),
      true
    );
  }

  // Returns the appropriate monster evolution animation source based on the phase
  private static getEvolutionSource(phase: number): string {
    // Map different evolution animations based on phase
    const evolutionMap: { [key: number]: string } = {
      1: EVOL_MONSTER[0],
    };

    return evolutionMap[phase] || EVOL_MONSTER[0]; // fallback to first evolution if phase not found
  }

  setCanvasPosition(position: 'evolution' | 'normal') {
    const pos = CANVAS_Z_INDEX_MAP[position];
    if (this.evolutionProps.canvas) {
      this.evolutionProps.canvas.style.zIndex = pos.zIndex;
    }
  }

  private handleEvolutionComplete() {
    const bgElement = document.getElementById('levelend-background');
    if (bgElement) {
      bgElement.classList.add('fade-out');
    }
    this.setCanvasPosition('normal');
  }

  public startAnimation() {
    // Set gray class 900ms before fade-out
    setTimeout(() => {
      const levelEndBg = document.getElementById('levelend-background');
      if (levelEndBg) {
        levelEndBg.classList.add('gray');
      }
    }, this.EVOLUTION_ANIMATION_FADE_EFFECT_DELAY);

    // Set timeout to handle animation completion
    setTimeout(() => {
      this.handleEvolutionComplete();

      //update the record in game state.
      gameStateService.updateMonsterPhaseState(this.monsterPhaseNumber);
      
      if (this.evolutionProps.onComplete) {
        this.evolutionProps.onComplete();
      }
    }, this.EVOLUTION_ANIMATION_COMPLETE_DELAY);
  }

  public dispose() {
    if (this.backgroundElement) {
      this.backgroundElement.destroy();
    }
    super.dispose();
  }
}
