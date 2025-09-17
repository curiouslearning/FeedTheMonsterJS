import { AudioPlayer } from "@components";
import {
  AUDIO_PATH_EATS,
  AUDIO_PATH_MONSTER_SPIT,
  AUDIO_PATH_MONSTER_DISSAPOINTED,
  AUDIO_PATH_POINTS_ADD,
  AUDIO_PATH_CHEERING_FUNC,
  AUDIO_PATH_CORRECT_STONE
} from '@constants';
import { Utils } from '@common';
import gameStateService from '@gameStateService';

/**
 * Feedback type enum for different feedback scenarios
 */
export enum FeedbackType {
  CORRECT_ANSWER = 'correct_answer',
  PARTIAL_CORRECT = 'partial_correct',
  INCORRECT = 'incorrect'
}

/**
 * Handles feedback audio for game puzzles
 * Centralizes all audio feedback logic related to correct/incorrect letter drops
 */
export default class FeedbackAudioHandler {
  private audioPlayer: AudioPlayer;
  private feedbackAudios: string[];
  private correctStoneAudio: HTMLAudioElement;

  constructor(feedbackAudios: any) {
    this.audioPlayer = new AudioPlayer();
    this.feedbackAudios = this.convertFeedBackAudiosToList(feedbackAudios);
    this.correctStoneAudio = new Audio(AUDIO_PATH_CORRECT_STONE);
    this.correctStoneAudio.loop = false;
  }

  /**
   * Plays feedback audio based on the feedback type
   * @param feedbackType - The type of feedback to play
   * @param feedBackIndex - Index for feedback audio selection
   */
  public playFeedback(feedbackType: FeedbackType, feedBackIndex: number): void {
    switch (feedbackType) {
      case FeedbackType.CORRECT_ANSWER:
        this.playCorrectAnswerFeedbackSound(feedBackIndex);
        break;
      case FeedbackType.PARTIAL_CORRECT:
        this.playPartialCorrectFeedbackSound();
        break;
      case FeedbackType.INCORRECT:
        this.playIncorrectFeedbackSound();
        break;
    }
  }

  private audioEndCallback(){
    gameStateService.publish(gameStateService.EVENTS.LOAD_NEXT_GAME_PUZZLE, true);
  };

  /**
   * Plays audio for a partially correct answer (e.g., correct letter in a word puzzle)
   */
  private playPartialCorrectFeedbackSound(): void {
    this.audioPlayer.playAudioQueue(
      false,
      AUDIO_PATH_EATS,
      AUDIO_PATH_CHEERING_FUNC(2)
    );
  }

  /**
   * Plays audio for an incorrect answer
   */
  private playIncorrectFeedbackSound(): void {
    this.audioPlayer.playAudioQueue(
      false,
      AUDIO_PATH_EATS
    );

    setTimeout(() => {
      this.audioPlayer.playAudioQueue(
        false,
        AUDIO_PATH_MONSTER_SPIT,
        Math.round(Math.random()) > 0 ? AUDIO_PATH_MONSTER_DISSAPOINTED : null
      );
        this.audioEndCallback();
    }, 1700); // 1700ms is tailored to handleStoneDropEnd 1000 delay of isSpit animation
  }

  /**
   * Plays the correct answer feedback sounds
   * @param feedBackIndex - Index for feedback audio selection
   */
  private async playCorrectAnswerFeedbackSound(feedBackIndex: number): Promise<void> {
    try {
      // Play feedback audio in parallel for better performance
      const randomNumber = Utils.getRandomNumber(1, 3).toString();
      await Promise.allSettled([
        this.correctStoneAudio.play(),
        this.audioPlayer.playAudioQueue(
          false,
          AUDIO_PATH_EATS,
          AUDIO_PATH_CHEERING_FUNC(randomNumber),
          AUDIO_PATH_POINTS_ADD,
          Utils.getConvertedDevProdURL(this.feedbackAudios[feedBackIndex])
        )
      ]);
      setTimeout(() => {
        this.audioEndCallback(); // Callback after audios finish playing
      }, 4000);
    } catch (error) {
      setTimeout(() => {
        this.audioEndCallback(); // Ensure callback is called even if audio fails
      }, 4000); 
      console.warn('Audio playback failed:', error);
    }
  }

  /**
   * Stops all feedback audio
   */
  public stopAllAudio(): void {
    this.audioPlayer.stopAllAudios();
    if (this.correctStoneAudio) {
      this.correctStoneAudio.pause();
    }
  }

  /**
   * Converts feedback audios to a list format
   * @param feedbackAudios - The feedback audios object
   * @returns Array of feedback audio paths
   */
  private convertFeedBackAudiosToList(feedbackAudios): string[] {
    return [
      feedbackAudios["fantastic"],
      feedbackAudios["great"],
      feedbackAudios["amazing"]
    ];
  }

  /**
   * Cleans up resources
   */
  public dispose(): void {
    this.audioPlayer.stopAllAudios();
    if (this.correctStoneAudio) {
      this.correctStoneAudio.pause();
      this.correctStoneAudio.src = '';
    }
  }
}
