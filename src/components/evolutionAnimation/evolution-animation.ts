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
  private isPlayingIntroFromVisibilityChange: boolean = false;
  private evolutionCompleteTimeoutId: number | null = null;
  private fadeEffectTimeoutId: number | null = null;
  private evolutionSoundEffectsTimeoutId: number | null = null;
  private lastVisibilityState: boolean = true;

  /**
   * Bound reference to the handleVisibilityChange method.
   * This ensures the same function reference is used for both adding and removing
   * the event listener, which is necessary for proper cleanup.
   */
  private boundHandleVisibilityChange: (event: DocumentEventMap['visibilitychange']) => void;

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
    this.lastVisibilityState = isDocumentVisible();
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
    // Use a bound method reference to ensure we can properly remove it later
    this.boundHandleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.boundHandleVisibilityChange, false);
  }

  /**
   * Pauses all audio playback
   * This method is used when the document is not visible
   */
  private pauseAudios() {
    // Only stop audios if the document is not visible
    if (!isDocumentVisible() && this.audioPlayer) {
      this.audioPlayer.stopAllAudios();
      this.isPlayingIntroFromVisibilityChange = false;
    }
  }

  /**
   * Handler for visibility change events that manages audio playback based on tab visibility
   */
  handleVisibilityChange = () => {
    const currentVisibility = isDocumentVisible();
    
    // Only process if visibility actually changed
    if (currentVisibility !== this.lastVisibilityState) {
      this.lastVisibilityState = currentVisibility;
      
      !currentVisibility ? this.pauseAudios() : this.playIntroAudio();
    }
  };

  /**
   * Plays the intro audio when returning to the tab
   */
  private playIntroAudio() {
    // Set flag to indicate we're playing intro audio due to visibility change
    this.isPlayingIntroFromVisibilityChange = true;
    
    // Preload and play the intro audio
    this.audioPlayer.preloadGameAudio(AUDIO_INTRO)
      .then(() => {
        // Double-check visibility before playing to avoid unnecessary audio playback
        if (isDocumentVisible()) {
          this.audioPlayer.playAudioQueue(false, AUDIO_INTRO);
        } else {
          this.isPlayingIntroFromVisibilityChange = false;
        }
      })
      .catch(() => {
        this.isPlayingIntroFromVisibilityChange = false;
      });
  }

  /**
   * Clears all timeouts to prevent memory leaks and unexpected behavior
   */
  private clearAllTimeouts() {
    if (this.evolutionCompleteTimeoutId !== null) {
      clearTimeout(this.evolutionCompleteTimeoutId);
      this.evolutionCompleteTimeoutId = null;
    }
    
    if (this.fadeEffectTimeoutId !== null) {
      clearTimeout(this.fadeEffectTimeoutId);
      this.fadeEffectTimeoutId = null;
    }
    
    if (this.evolutionSoundEffectsTimeoutId !== null) {
      clearTimeout(this.evolutionSoundEffectsTimeoutId);
      this.evolutionSoundEffectsTimeoutId = null;
    }
  }

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
    // If intro audio is already playing from visibility change, skip playing evolution audio
    if (this.isPlayingIntroFromVisibilityChange) {
      return;
    }

    // First stop any currently playing audio
    this.audioPlayer.stopAllAudios();

    // Only proceed if the tab is visible to avoid unnecessary audio loading
    if (!isDocumentVisible()) {
      return;
    }

    // Preload all audio files to ensure they're ready to play
    Promise.all([
      this.audioPlayer.preloadGameAudio(AUDIO_MONSTER_EVOLVE),
      this.audioPlayer.preloadGameAudio(AUDIO_INTRO)
    ]).then(() => {
      // Double-check visibility before playing
      if (isDocumentVisible() && !this.isPlayingIntroFromVisibilityChange) {
        // Play audio sequence in order using the playAudioQueue method
        this.audioPlayer.playAudioQueue(
          false, 
          AUDIO_MONSTER_EVOLVE,
          AUDIO_INTRO
        );
      }
    }).catch(() => {
      // Silent error handling
    });
  }

  public startAnimation() {
    //Call the logic that will handle the audio during the evolution animation.
    this.playEvolutionSoundEffects();

    // Set gray class 900ms before fade-out
    this.fadeEffectTimeoutId = setTimeout(() => {
      const levelEndBg = document.getElementById('levelend-background');
      if (levelEndBg) {
        levelEndBg.classList.add('gray');
      }
    }, this.EVOLUTION_ANIMATION_FADE_EFFECT_DELAY) as unknown as number;

    // Set timeout to handle animation completion
    this.evolutionCompleteTimeoutId = setTimeout(() => {
      // Only proceed with visual and audio effects if the tab is visible
      if (isDocumentVisible()) {
        this.handleEvolutionComplete();

        //update the record in game state.
        gameStateService.updateMonsterPhaseState(this.monsterPhaseNumber);
      }
      
      // Always call onComplete callback regardless of visibility
      // This ensures tests can verify the callback is called
      if (this.evolutionProps.onComplete) {
        this.evolutionProps.onComplete();
      }
      
      // Clear the timeout ID since it has executed
      this.evolutionCompleteTimeoutId = null;
    }, this.EVOLUTION_ANIMATION_COMPLETE_DELAY) as unknown as number;
  }

  private playEvolutionSoundEffects() {
    // The 'Play' event is triggered because we need to play an audio during the play animation of the Rive entity.
    this.executeRiveAction('Play', () => {
      this.evolutionSoundEffectsTimeoutId = setTimeout(() => {
        // Only play if tab is visible
        if (isDocumentVisible()) {
          this.audioPlayer.playAudioQueue(false, EVOLUTION_AUDIOS.EVOL_1[0]);
        }
      }, 1000) as unknown as number;
    });
  }

  public dispose() {
    // Clear all timeouts first to prevent any pending operations
    this.clearAllTimeouts();
    
    if (this.backgroundElement) {
      this.backgroundElement.destroy();
    }

    // Stop any playing audio before disposing
    if (this.audioPlayer) {
      this.audioPlayer.stopAllAudios();
    }

    // Remove visibility change listener when dispose
    document.removeEventListener('visibilitychange', this.boundHandleVisibilityChange, false);

    super.dispose();
  }
}
