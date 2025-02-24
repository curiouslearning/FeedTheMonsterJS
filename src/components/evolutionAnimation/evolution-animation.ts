import { BaseHTML } from '@components/baseHTML/base-html';
import { RiveMonsterComponent, RiveMonsterComponentProps } from '@components/riveMonster/rive-monster-component';
import { EVOL_MONSTER } from '@constants';

export interface EvolutionAnimationProps extends RiveMonsterComponentProps {
  monsterPhaseNumber: number;
  onComplete?: () => void;
}

export class EvolutionAnimationComponent extends RiveMonsterComponent {
  private backgroundElement: BaseHTML;
  protected evolutionProps: EvolutionAnimationProps;

  constructor(props: EvolutionAnimationProps) {
    const evolutionSrc = EvolutionAnimationComponent.getEvolutionSource(props.monsterPhaseNumber);
    super({
      ...props,
      src: evolutionSrc,
      isEvolving: true,
    });
    this.evolutionProps = props;
    this.initialize();
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
      2: EVOL_MONSTER[1],
      3: EVOL_MONSTER[2]
    };

    return evolutionMap[phase] || EVOL_MONSTER[1]; // fallback to second evolution if phase not found
  }

  setCanvasPosition(position: 'evolution' | 'normal') {
    const CANVAS_POSITIONS = {
      evolution: {
        zIndex: '13',
      },
      normal: {
        zIndex: '4',
      }
    };

    const pos = CANVAS_POSITIONS[position];
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
    // Set timeout to handle animation completion
    setTimeout(() => {
      this.handleEvolutionComplete();
      
      if (this.evolutionProps.onComplete) {
        this.evolutionProps.onComplete();
      }
    }, 5500); // Match the EVOLUTION_ANIMATION_DELAY
  }

  public dispose() {
    if (this.backgroundElement) {
      this.backgroundElement.destroy();
    }
    super.dispose();
  }
}
