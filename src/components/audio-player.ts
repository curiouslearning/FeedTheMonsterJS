import { Window } from "@common";
import { AUDIO_PATH_BTN_CLICK } from "@constants";
import scheduler from "@services/scheduler";


/**
 * Singleton class that manages audio playback for the game.
 * Handles both pausible game audio and non-pausable UI audio,
 * along with preloading, queuing, and audio context management.
 */
export class AudioPlayer {
  public static instance: AudioPlayer;

  private audioContext: AudioContext | null;
  private nonPausableAudioContext: AudioContext | null;
  private sourceNode: AudioBufferSourceNode | null;
  private audioQueue: string[];

  private promptAudioBuffer: AudioBuffer | null;
  private clickSoundBuffer: AudioBuffer | null;
  private static audioBuffers: Map<string, AudioBuffer> = new Map();
  public audioSourcs: Array<AudioBufferSourceNode> = [];
  private isClickSoundLoaded: boolean;
  private playAudioTimeoutId: any;
  private isPromptAudioPlaying: boolean;

  constructor() {
    if( AudioPlayer.instance )
      return AudioPlayer.instance;
    AudioPlayer.instance = this;
    this.audioContext = AudioContextManager.getAudioContext();
    this.nonPausableAudioContext = AudioContextManager.getNonPausableAudioContext();
    this.sourceNode = null;
    this.audioQueue = [];
    this.clickSoundBuffer = null; // Initialize the clickSoundBuffer
    this.isClickSoundLoaded = false; // Initialize as false
    this.isPromptAudioPlaying = false;

  }

  /**
   * Plays a UI audio effect (non-pausable).
   * Used for interface sounds like button clicks that should persist even when the game is paused.
   * @param audioSrc - The source path or identifier of the audio to play.
   * @param volume - The volume level (default: 1).
   * @param onEnded - Optional callback to execute when audio playback ends.
   * @returns The created AudioBufferSourceNode if successful, or null.
   */
  playUIAudio(audioSrc: string, volume: number = 1, onEnded?: () => void) {
    const audioBuffer: AudioBuffer = AudioPlayer.audioBuffers.get(audioSrc);
    if (audioBuffer) {
      const sourceNode = this.nonPausableAudioContext.createBufferSource();
      const gainNode = this.nonPausableAudioContext.createGain();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(gainNode);
      gainNode.connect(this.nonPausableAudioContext.destination);
      // handle end of playback
      if (onEnded) {
        sourceNode.onended = onEnded;
      }

      gainNode.gain.value = volume; // Set volume (1 = full, 0.5 = half, etc.)

      this.audioSourcs.push(sourceNode);
      sourceNode.start();

      return sourceNode;
    }
    return null;
  }

  /**
   * Plays the standard button click sound.
   */
  async playButtonClickSound() {
    const audioSrc: string = AUDIO_PATH_BTN_CLICK;
    this.playUIAudio(audioSrc);
  }

  /**
   * Internal helper to load audio data from a URL and decode it into an AudioBuffer.
   * @param audioSrc - The URL of the audio file.
   * @returns A promise resolving to the decoded AudioBuffer.
   */
  private async loadAndDecodeAudio(audioSrc: string): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>(async (resolve, reject) => {
      try {
        const response = await fetch(audioSrc);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        resolve(audioBuffer);
      } catch (error) {
        console.error("Error loading or decoding audio:", error);
        reject(error);
      }
    });
  }

  /**
   * Preloads and decodes the prompt audio file.
   * @param audioSrc - The source path of the audio to preload.
   */
  async preloadPromptAudio(audioSrc: string) {
    const audioBuffer: AudioBuffer = await this.loadAndDecodeAudio(audioSrc);
    if (audioBuffer) {
      this.promptAudioBuffer = audioBuffer;
    }
  }

  /**
   * Preloads and decodes a generic game audio file if not already cached.
   * @param audioSrc - The source path of the audio to preload.
   */
  async preloadGameAudio(audioSrc: string) {
    if (AudioPlayer.audioBuffers.has(audioSrc)) {
      return;
    }

    const audioBuffer: AudioBuffer = await this.loadAndDecodeAudio(audioSrc);
    if (audioBuffer) {
      AudioPlayer.audioBuffers.set(audioSrc, audioBuffer);
    }
  }

  /**
   * Plays a game audio effect (pausable).
   * @param audioSrc - The source path or identifier of the audio to play.
   * @param volume - The volume level (default: 1).
   * @param onEnded - Optional callback to execute when audio playback ends.
   * @returns The created AudioBufferSourceNode if successful, or null.
   */
  playAudio(audioSrc: string, volume: number = 1, onEnded?: () => void) {
    const audioBuffer: AudioBuffer = AudioPlayer.audioBuffers.get(audioSrc);
    if (audioBuffer) {
      const sourceNode = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // handle end of playback
      if (onEnded) {
        sourceNode.onended = onEnded;
      }

      gainNode.gain.value = volume; // Set volume (1 = full, 0.5 = half, etc.)

      this.audioSourcs.push(sourceNode);
      sourceNode.start();

      return sourceNode;
    }
    return null;
  }

  /**
   * Stops the currently playing audio immediately (if any).
   * Useful when you want to cut off playback before it completes.
   */
  public stopAudio = (): void => {
    // Stop single active sourceNode if it's playing
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (err) {
        console.warn("Audio already stopped:", err);
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Also stop any queued/parallel sources (like prompt/game audios)
    if (this.audioSourcs.length > 0) {
      this.audioSourcs.forEach((src) => {
        try {
          src.stop();
        } catch (err) {
          console.warn("Audio already stopped:", err);
        }
        src.disconnect();
      });
      this.audioSourcs = [];
    }

    // Reset playback flags and queues
    this.isPromptAudioPlaying = false;
    this.audioQueue = [];

    // Clear any pending timeout for debounced play
    if (this.playAudioTimeoutId) {
      clearTimeout(this.playAudioTimeoutId);
      this.playAudioTimeoutId = null;
    }
  };

  /**
   * Queues multiple audio files to be played sequentially.
   * @param loop - Whether to loop the sequence.
   * @param fileUrl - Variable number of audio file URLs to play.
   */
  playAudioQueue = (loop: boolean = false, ...fileUrl: string[]): void => {
    if (fileUrl.length > 0) {
      this.audioQueue = fileUrl;
      this.playFetch(0, loop);
    }
  };

  /**
   * Plays the currently preloaded prompt audio.
   * @param onEndedCallback - Optional callback to execute when playback finishes.
   */
  playPromptAudio = (onEndedCallback: () => void | null = null) => {
    if (this.promptAudioBuffer) {
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = this.promptAudioBuffer;
      sourceNode.connect(this.audioContext.destination);
      this.audioSourcs.push(sourceNode);

      // Set up a callback that fires when the audio playback ends.
      sourceNode.onended = onEndedCallback;
      //Start the audio play.
      sourceNode.start();
    }
  };


  /**
  ** To manage audio playback in response to user clicks, we use both a timeout delay 
  ** and a playback flag (`isPromptAudioPlaying`).
  **
  ** - The `setTimeout` serves as a debounce mechanism, preventing immediate playback on every click.
  **   The delay is dynamically calculated as half of the audio’s duration. This adapts to different 
  **   sound lengths and avoids relying on a fixed delay like 500ms.
  **
  ** - The `isPromptAudioPlaying` flag ensures that once an audio clip is actively playing, 
  **   no other playback is triggered until it ends. This prevents overlapping or duplicated playback.
  ** - An optional `externalCallback` can now be provided, allowing external logic (e.g., starting animations)
  **   to be triggered right after the audio finishes playing. This keeps the method flexible and decoupled.
  **
  ** Using both strategies together allows us to:
  ** - Prevent audio spam and overlapping sounds
  ** - Ensure that at least one playback still happens even during rapid clicks
  ** - Maintain a smooth and responsive user experience during frequent interactions
  ** 
  **/
  handlePlayPromptAudioClickEvent(externalCallback: () => void = null) {
    // Only proceed if audio isn't already playing
    if (this.promptAudioBuffer && !this.isPromptAudioPlaying) {
      const audioDuration = this.promptAudioBuffer?.duration;
      // Use half of the audio's duration as a dynamic debounce delay.
      // This helps reduce audio spam from rapid clicks, while ensuring
      // at least one playback occurs during bursts of input.
      const timeoutDelay = audioDuration / 2;

      if (this.playAudioTimeoutId) {
        this.isPromptAudioPlaying = true;
        clearTimeout(this.playAudioTimeoutId);
      }

      // Schedule the next audio play after current one ends
      this.playAudioTimeoutId = scheduler.setTimeout(() => {
        //Call playPromptAudio with a callback for onended method to call.
        this.playPromptAudio(() => {
          this.isPromptAudioPlaying = false;

          // Trigger optional external callback after audio finishes
          if (externalCallback) {
            externalCallback();
          }
        });
      }, timeoutDelay);
    }
  }

  /**
   * Stops and clears the currently playing feedback audio sequence.
   */
  stopFeedbackAudio = (): void => {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    this.audioQueue = [];
  };

  /**
   * Stops all currently playing audio sources, including feedback and queued sounds.
   */
  stopAllAudios = () => {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    this.audioQueue = [];

    this.audioSourcs.forEach((sourceNode) => {
      sourceNode.stop();
    });
    this.audioSourcs = [];
  };

  /**
   * Suspends the audio context, effectively pausing all game audio.
   */
  pauseAllAudios = () => {
    if( this.audioContext && this.audioContext.state === "running") {
      this.audioContext.suspend();
    }
  }

  /**
   * Resumes the audio context, unpausing all game audio.
   */
  resumeAllAudios = () => {
    if( this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    } 
  }

  /**
   * Internal helper to fetch and play an audio file from the queue.
   * @param index - The index in the queue to play.
   * @param loop - Whether the sequence should loop.
   */
  private playFetch = (index: number, loop: boolean) => {
    if (index >= this.audioQueue.length) {
      this.stopFeedbackAudio();
      return;
    }

    if (this.audioQueue[index]) {
      fetch(this.audioQueue[index])
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          this.audioContext?.decodeAudioData(buffer, (audioBuffer) => {
            this.sourceNode = this.audioContext?.createBufferSource();
            this.sourceNode.buffer = audioBuffer;
            this.sourceNode.connect(this.audioContext?.destination);
            this.sourceNode.loop = loop;
            this.sourceNode.onended = () => this.handleAudioEnded(index, loop);
            this.sourceNode.start();
          });
        });
    }
  };

  /**
   * Internal handler for when an audio source in a sequence finishes playing.
   * @param index - The index of the audio that just finished.
   * @param loop - Whether the sequence should loop.
   */
  private handleAudioEnded = (index: number, loop: boolean): void => {
    if (this.sourceNode) {
      this.sourceNode.onended = null;
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.playFetch(index + 1, loop);
  };
}

/**
 * Manages the initialization and retrieval of Web Audio API AudioContexts.
 * Provides separate contexts for pausable game audio and non-pausable UI audio.
 */
class AudioContextManager {
  private static instance: AudioContext | null = null;
  private static nonPausableAudioContext: AudioContext | null = null;

  /**
   * Returns the shared AudioContext for game-related audio.
   * @returns The active AudioContext.
   */
  static getAudioContext(): AudioContext {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new (window.AudioContext ||
        (window as Window).webkitAudioContext)();
    }
    return AudioContextManager.instance;
  }

  /**
   * Returns the shared AudioContext for UI-related audio that should not be paused.
   * @returns The active non-pausable AudioContext.
   */
  static getNonPausableAudioContext(): AudioContext {
    if (!AudioContextManager.nonPausableAudioContext) {
      AudioContextManager.nonPausableAudioContext = new (window.AudioContext ||
        (window as Window).webkitAudioContext)();
    }
    return AudioContextManager.nonPausableAudioContext;
  }
}