import { BaseHTML } from '@components/baseHTML/base-html';
import { RiveMonsterComponent, RiveMonsterComponentProps } from '@components/riveMonster/rive-monster-component';
import {
  EVOL_MONSTER,
  AUDIO_INTRO,
  AUDIO_MONSTER_EVOLVE,
  EVOLUTION_AUDIOS
} from '@constants';
import gameStateService from '@gameStateService';
import { AudioPlayer } from '@components/audio-player';
import { isDocumentVisible } from '@common';

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
  private readonly EVOLUTION_ANIMATION_COMPLETE_DELAY = 7500;
  private readonly EVOLUTION_ANIMATION_FADE_EFFECT_DELAY = 500;
  private audioPlayer: AudioPlayer;

  constructor(props: EvolutionAnimationProps) {
    const evolutionSrc = EvolutionAnimationComponent.getEvolutionSource(props.monsterPhaseNumber);
    super({
      ...props,
      src: evolutionSrc
    });
    
    this.evolutionProps = props;
    this.monsterPhaseNumber = gameStateService.checkMonsterPhaseUpdation();
    this.audioPlayer = new AudioPlayer();
    this.initialize();
    this.addEventListener();
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

  /**
   * Adds event listener to pause audio when tab is not visible
   */
  addEventListener() {
    document.addEventListener('visibilitychange', this.pauseAudios, false);
  }

  /**
   * Handler for visibility change events that stops audio playback when tab is hidden
   */
  pauseAudios = () => {
    if (!isDocumentVisible()) {
      // Pause all audio when tab is not visible
      this.audioPlayer.stopAllAudios();
    }
  };

  // Returns the appropriate monster evolution animation source based on the phase
  private static getEvolutionSource(phase: number): string {
    // Map different evolution animations based on phase
    const evolutionMap: { [key: number]: string } = {
      1: EVOL_MONSTER[0],
      2: EVOL_MONSTER[1],
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
    // Play the audio sequence first before any visual changes
    this.playEvolutionCompletionAudios();
    
    // Then handle the visual changes
    const bgElement = document.getElementById('levelend-background');
    if (bgElement) {
      bgElement.classList.add('fade-out');
    }
    this.setCanvasPosition('normal');
  }

  // Play audio sequence after evolution animation completes
  private playEvolutionCompletionAudios() {
    // First stop any currently playing audio
    this.audioPlayer.stopAllAudios();

    // Preload all audio files to ensure they're ready to play
    Promise.all([
      this.audioPlayer.preloadGameAudio(AUDIO_MONSTER_EVOLVE),
      this.audioPlayer.preloadGameAudio(AUDIO_INTRO)
    ]).then(() => {
      // Play audio sequence in order using the playFeedbackAudios method
      this.audioPlayer.playFeedbackAudios(
        false, 
        AUDIO_MONSTER_EVOLVE,
        AUDIO_INTRO
      );
    }).catch(error => {
      console.error('Error preloading evolution audio files:', error);
    });
  }

  public startAnimation() {
    //Call the logic that will handle the audio during the evolution animation.
    this.playEvolutionSoundEffects();

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

  private playEvolutionSoundEffects() {
    // The 'Play' event is triggered because we need to play an audio during the play animation of the Rive entity.
    this.executeRiveAction('Play', () => {
      //To do - playFeedbackAudios should be renamed as this was the common method used to play all audios not just feedback audio.
      setTimeout(() => {
        this.audioPlayer.playFeedbackAudios(false, EVOLUTION_AUDIOS.EVOL_1[0]);
      }, 1000);
    });
  }

  public dispose() {
    if (this.backgroundElement) {
      this.backgroundElement.destroy();
    }

    // Stop any playing audio before disposing
    if (this.audioPlayer) {
      this.audioPlayer.stopAllAudios();
    }

    // Remove visibility change listener when dispose
    document.removeEventListener('visibilitychange', this.pauseAudios, false);

    super.dispose();
  }
}
