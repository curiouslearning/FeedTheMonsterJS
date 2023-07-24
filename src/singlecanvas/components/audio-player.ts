import { Window } from "../../../global-variables";

export class AudioPlayer {
  private audioContext: AudioContext | null;
  private sourceNode: AudioBufferSourceNode | null;
  private audioQueue: string[];

  constructor() {
    this.audioContext = new (window.AudioContext ||
      (window as Window).webkitAudioContext)();
    this.sourceNode = null;
    this.audioQueue = [];
  }

  playAudio = (loop: boolean = false, ...fileUrl: string[]): void => {
    this.audioQueue = fileUrl;
    if (this.audioQueue.length > 0) {
      this.playFetch(0, loop);
    }
  }

  private playFetch = (index: number, loop: boolean) => {
    if (index >= this.audioQueue.length) {
      this.stopAudio();
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

  stopAudio = (): void => {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    this.audioQueue = [];
  }

  // public unregisterEvents() {
  //   this.sourceNode.removeEventListener("ended", this.handleAudioEnded, false);
  // }
}
