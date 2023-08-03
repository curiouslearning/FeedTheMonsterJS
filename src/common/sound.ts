import { lang } from "../../global-variables";
import { IsCached, IntroMusic, loadingScreen, PromptAudio } from "./common";
let is_cached = localStorage.getItem(IsCached)
  ? new Map(JSON.parse(localStorage.getItem(IsCached)))
  : new Map();
let inactive_screen = false;
export default class Sound {
  public playingSources: Array<AudioBufferSourceNode> = [];
  public introSound: AudioBufferSourceNode;
  public audioContext: AudioContext = new AudioContext();

  playSound(src, type?) {
    // console.log(" soundplayinghere " , src);
    if (type != PromptAudio) {
      let source = audioContext.createBufferSource();
      source.buffer = audioBuffers[src];
      if (source.buffer == null) {
        this.fetchFromServer(src);
      }
      source.connect(audioContext.destination);
      source.start(0);
      this.playingSources.push(source);
    } else {
      this.fetchFromServer(src);
    }
  }
  fetchFromServer(src) {
    fetch(src)
      .then((response) => response.arrayBuffer())
      .then((buffer) => this.audioContext.decodeAudioData(buffer))
      .then((audioBuffer) => {
        var source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        this.playingSources.push(source);
        source.start();
      });
  }
  activeScreen() {
    if (inactive_screen) {
      inactive_screen = false;
    } else {
      this.pauseSound();
      inactive_screen = true;
    }
  }
  pauseSound() {
    for (var i = 0; i < this.playingSources.length; i++) {
      this.playingSources[i].stop();
    }
    this.playingSources = [];
  }
  changeSourse(src) {
    // this.audio.src = src;
    this.playSound(src);
  }
  playLevelEndHappyAudio(levelWinAudio) {
    // this.audio.src = levelWinAudio;
    // this.playSound(levelWinAudio);
    // setTimeout(() => {
    //   this.introAudio.play();
    // }, 700);
  }
}
let audioContext = new AudioContext();
let audioBuffers = {};
let audioUrls = [
  "./assets/audios/intro.mp3",
  "./assets/audios/Cheering-02.mp3",
  "./assets/audios/onDrag.mp3",
  "./assets/audios/timeout.mp3",
  "./assets/audios/LevelWinFanfare.mp3",
  "./assets/audios/LevelLoseFanfare.mp3",
  "./assets/audios/ButtonClick.mp3",
  "./lang/" + lang + "/audios/fantastic.mp3",
  "./lang/" + lang + "/audios/great.mp3",
  "./assets/audios/Monster Spits wrong stones-01.mp3",
  "./assets/audios/Disapointed-05.mp3",
  "./assets/audios/Eat.mp3",
];

function loadAudio(url) {
  return new Promise<void>((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
      audioContext.decodeAudioData(request.response, function (buffer) {
        audioBuffers[url] = buffer;
        resolve();
      });
    };
    request.onerror = function () {
      reject(new Error("Error loading audio file"));
    };
    request.send();
  });
}

let loadPromises = audioUrls.map((url) => loadAudio(url).catch((err) => { }));
Promise.all(loadPromises).then(() => {
  if (is_cached.has(lang)) {
    loadingScreen(false);
  }
  // You can now use the audioBuffers object to play the preloaded audio files
});
