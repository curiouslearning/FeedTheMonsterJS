import { Window } from "../../global-variables";

export class AudioPlayer {
  private audioContext: AudioContext | null;
  private sourceNode: AudioBufferSourceNode | null;
  private audioQueue: string[];

  //
  private promptAudioBuffer: AudioBuffer | null;
  private static audioBuffers: Map<string, AudioBuffer> = new Map();
  private audioSourcs: Array<AudioBufferSourceNode> = [];

  constructor() {
    this.audioContext = AudioContextManager.getAudioContext();
    this.sourceNode = null;
    this.audioQueue = [];
  }

  async preloadPromptAudio(audioSrc: string) {
    const audioBuffer: AudioBuffer = await this.loadAndDecodeAudio(audioSrc);
    if (audioBuffer) {
      this.promptAudioBuffer = audioBuffer;
    }
  }

  async preloadGameAudio(audioSrc: string) {
    if (AudioPlayer.audioBuffers.has(audioSrc)) {
      return;
    }

    const audioBuffer: AudioBuffer = await this.loadAndDecodeAudio(audioSrc);
    if (audioBuffer) {
      AudioPlayer.audioBuffers.set(audioSrc, audioBuffer);
    }
  }

  playAudio(audioSrc: string) {
    const audioBuffer: AudioBuffer = AudioPlayer.audioBuffers.get(audioSrc)
    if (audioBuffer) {
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.audioContext.destination);
      this.audioSourcs.push(sourceNode);
      sourceNode.start();

    }
  }

  playFeedbackAudios = (loop: boolean = false, ...fileUrl: string[]): void => {
    this.audioQueue = fileUrl;
    if (this.audioQueue.length > 0) {
      this.playFetch(0, loop);
    }
  }

  playPromptAudio = (audioSrc: string) => {
    if (this.promptAudioBuffer) {
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = this.promptAudioBuffer;
      sourceNode.connect(this.audioContext.destination);
      this.audioSourcs.push(sourceNode);
      sourceNode.start();

    }
  }

  playButtonClickSound = (audioSrc: string) => {
    const audioBuffer: AudioBuffer = AudioPlayer.audioBuffers.get(audioSrc)
    if (audioBuffer) {
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.audioContext.destination);
      sourceNode.start();
    }
  }

  stopFeedbackAudio = (): void => {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    this.audioQueue = [];
  }

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
  }

  private playFetch = (index: number, loop: boolean) => {
    if (index >= this.audioQueue.length) {
      this.stopFeedbackAudio();
      return;
    }
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

  private handleAudioEnded = (index: number, loop: boolean): void => {
    // this.sourceNode.removeEventListener("ended", this.handleAudioEnded, false);
    if (this.sourceNode) {
      this.sourceNode.onended = null;
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.playFetch(index + 1, loop);
  }

  private async loadAndDecodeAudio(audioSrc: string): Promise<AudioBuffer> {
    return new Promise<AudioBuffer>(async (resolve, reject) => {
      try {
        const response = await fetch(audioSrc);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      } catch (error) {
        console.error('Error loading or decoding audio:', error);
        reject(error);
      }
    });
  }
}

class AudioContextManager {
  private static instance: AudioContext | null = null;
  static getAudioContext(): AudioContext {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new (window.AudioContext || (window as Window).webkitAudioContext)();
    }
    return AudioContextManager.instance;
  }
}