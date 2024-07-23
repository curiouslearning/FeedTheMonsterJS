import * as Sentry from "@sentry/browser";
import { getData } from "./src/data/api-data";
import { DataModal } from "./src/data/data-modal";
import { SceneHandler } from "./src/sceneHandler/scene-handler";
import { IsCached } from "./src/common/common";
import { Workbox } from "workbox-window";
import { Debugger, lang, pseudoId } from "./global-variables";
import { FirebaseIntegration } from "./src/Firebase/firebase-integration";
import { Utils } from "./src/common/utils";
import { AudioPlayer } from "./src/components/audio-player";
import { SessionStart,
SessionEnd,
DownloadCompleted
} from "./src/Firebase/firebase-event-interface";
import { VISIBILITY_CHANGE } from "./src/common/event-names"; 
declare const window: any;

class App {
  private canvas: HTMLCanvasElement;
  private versionInfoElement: HTMLElement;
  private lang: string;
  private is_cached: Map<string, boolean>;
  private progressBar: HTMLElement | null;
  private progressBarContainer: HTMLElement | null;
  private channel: BroadcastChannel;
  private sceneHandler: SceneHandler;
  private loadingElement: HTMLElement;
  private majVersion:string;
  private minVersion:string;
  private startSessionTime:number;
  firebaseIntegration: FirebaseIntegration;
  constructor(lang: string) {
    this.lang = lang;
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.channel = new BroadcastChannel("my-channel");
    this.progressBar = document.getElementById("progress-bar") as HTMLElement;
    this.progressBarContainer = document.getElementById("progress-bar-container") as HTMLElement;
    this.versionInfoElement = document.getElementById("version-info-id") as HTMLElement;
    this.loadingElement = document.getElementById('loading-screen') as HTMLElement;
    this.is_cached = this.initializeCachedData();
    this.firebaseIntegration = new FirebaseIntegration();
    this.startSessionTime = 0;
    this.init();
    this.channel.addEventListener("message", this.handleServiceWorkerMessage);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
    document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange);
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private async init() {
    const font = Utils.getLanguageSpecificFont(this.lang);
    await this.loadAndCacheFont(font, `./assets/fonts/${font}.ttf`);
    await this.preloadGameAudios();
    this.handleLoadingScreen();
    this.registerWorkbox();
    this.setupCanvas();
    const data = await getData();
    this.majVersion = data.majversion;
    this.minVersion = data.minversion;
    const dataModal = this.createDataModal(data);
    this.globalInitialization(data);
    this.logSessionStartFirebaseEvent();
    window.addEventListener("resize", async () => {
      this.handleResize(dataModal);
    });

    if (this.is_cached.has(this.lang)) {
      this.handleCachedScenario(dataModal);
    }
  }

  private logSessionStartFirebaseEvent() {
    let lastSessionEndTime = localStorage.getItem("lastSessionEndTime");
    let lastTime = 0;
    this.startSessionTime = new Date().getTime();
    if (lastSessionEndTime) {
      let parsedTimestamp = parseInt(lastSessionEndTime);
      if (!isNaN(parsedTimestamp)) {
        lastTime = Math.abs(new Date().getTime() - parsedTimestamp);
      }
    }
    const daysSinceLast = lastTime ? lastTime / (1000 * 60 * 60 * 24) : 0;
    const roundedDaysSinceLast = parseFloat(daysSinceLast.toFixed(3));
    const sessionStartData: SessionStart = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: this.versionInfoElement.innerHTML,
      json_version_number: !!this.majVersion && !!this.minVersion ? this.majVersion.toString() + "." + this.minVersion.toString() : "",
      days_since_last: roundedDaysSinceLast,
    };
    this.firebaseIntegration.sendSessionStartEvent(sessionStartData);
  }

  private logSessionEndFirebaseEvent() {
    const sessionEndData: SessionEnd = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: this.versionInfoElement.innerHTML,
      json_version_number: !!this.majVersion && !!this.minVersion ? this.majVersion.toString() + "." + this.minVersion.toString() : "",
      duration: (new Date().getTime() - this.startSessionTime) / 1000,
    };
    localStorage.setItem("lastSessionEndTime", new Date().getTime().toString());
    this.firebaseIntegration.sendSessionEndEvent(sessionEndData);
  }

  private initializeCachedData(): Map<string, boolean> {
    const storedData = localStorage.getItem(IsCached);
    return storedData ? new Map(JSON.parse(storedData)) : new Map();
  }

  private async loadAndCacheFont(fontName: string, fontPath: string) {
    try {
      const cache = await caches.open('fontCache');
      const response = await cache.match(fontPath);
      if (!response) {
        const fontResponse = await fetch(fontPath);
        const fontBlob = await fontResponse.blob();
        await cache.put(fontPath, new Response(fontBlob));
      }
      const font = new FontFace(fontName, `url(${fontPath}) format('truetype')`);
      await font.load();
      document.fonts.add(font);
    } catch (error) {
      console.error(`Failed to load and cache font: ${error}`);
    }
  }

  private handleLoadingScreen = () => {
    if (this.is_cached.get(lang)) {
      this.loadingElement.style.zIndex = '-1';
      this.loadingElement.style.display = 'none';
      this.progressBarContainer.style.display = "none";
      this.progressBar.style.display = "none";
    } else {
      this.progressBarContainer.style.display = "flex";
      this.progressBar.style.display = "flex";
      this.progressBar.style.width = "30%";
    }
  }

  private async registerWorkbox(): Promise<void> {
    if ("serviceWorker" in navigator) {
      try {
        const wb = new Workbox("./sw.js", {});
        await wb.register();
        await navigator.serviceWorker.ready;
        if (!this.is_cached.has(this.lang)) {
          this.channel.postMessage({ command: "Cache", data: this.lang });
        }
        navigator.serviceWorker.addEventListener("message", this.handleServiceWorkerMessage);
      } catch (error) {
        console.error(`Failed to register service worker: ${error}`);
      }
    }
  }

  private setupCanvas() {
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.screen.width > 1024 ? 1024 : window.innerWidth;
  }

  private createDataModal(data: any): DataModal {
    return new DataModal(data.title, data.OtherAudios, data.Levels, data.FeedbackTexts, data.RightToLeft, data.FeedbackAudios, data.majversion, data.minversion, data.version);
  }

  private globalInitialization(data: any) {
    globalThis.aboutCompany = data.aboutCompany;
    globalThis.descriptionText = data.descriptionText;
  }

  private handleResize(dataModal: DataModal): void {
    if (this.is_cached.has(this.lang)) {
      this.updateVersionInfoElement(dataModal);
      this.setupCanvas();
      this.reinitializeSceneHandler(dataModal);
    }
  }

  private updateVersionInfoElement(dataModal: DataModal): void {
    if (this.is_cached.has(this.lang) && Debugger.DevelopmentLink) {
      if (dataModal.majVersion && dataModal.minVersion) {
        this.versionInfoElement.innerHTML += `/j.v${dataModal.majVersion}.${dataModal.minVersion}`;
      } else if (dataModal.version) {
        this.versionInfoElement.innerHTML += `/j.v${dataModal.version}`;
      }
      document.getElementById("toggle-btn").style.display = "block";
    }
  }

  private reinitializeSceneHandler(dataModal: DataModal): void {
    delete this.sceneHandler;
    this.sceneHandler = new SceneHandler(this.canvas, dataModal);
    this.passingDataToContainer();
  }

  private handleCachedScenario(dataModal: DataModal): void {
    this.updateVersionInfoElement(dataModal);
    this.sceneHandler = new SceneHandler(this.canvas, dataModal);
    this.passingDataToContainer();
  }

  public passingDataToContainer = (): void => {
    if (window.Android) {
      window.Android.cachedStatus(this.is_cached.get(this.lang) == true);
    }
  }

  public setContainerAppOrientation(): void {
    if (window.Android) {
      window.Android.setContainerAppOrientation("portrait");
    }
  }

  private handleUpdateFoundMessage(): void {
    let text: string = "Update Found\nPress ok to update";
    const userConfirmed: boolean = confirm(text);
    if (userConfirmed) {
      window.location.reload();
    }
  }

  private handleLoadingMessage = (data: { data: number, version: string }): void => {
    if (this.progressBarContainer && this.progressBar) {
      this.progressBarContainer.style.display = "flex";
      this.progressBar.style.display = "flex";

      if (parseInt(this.progressBar.style.width || "0") >= 40) {
        this.progressBar.style.width = `${data.data}%`;
      }

      if (data.data % 100 === 0 && !this.is_cached.get(this.lang)) {
        this.is_cached.set(this.lang, true);
        localStorage.setItem(IsCached, JSON.stringify(Array.from(this.is_cached.entries())));
        const download_completed: DownloadCompleted = {
          cr_user_id: pseudoId,
          ftm_language: lang,
          profile_number: 0,
          version_number: this.versionInfoElement.innerHTML,
          json_version_number: !!this.majVersion && !!this.minVersion ? this.majVersion.toString() + "." + this.minVersion.toString() : "",
        };
        this.firebaseIntegration.sendDownloadCompletedEvent(download_completed);
        localStorage.setItem("version" + this.lang, data.version);
        window.location.reload();
      }
      this.progressBar.style.width = `${data.data}%`;
    }
  }

  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    if (event.data.msg === "Loading") {
      this.handleLoadingMessage(event.data);
    } else if (event.data.msg === "Update Found") {
      this.handleUpdateFoundMessage();
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      this.logSessionStartFirebaseEvent();
    } else {
      this.logSessionEndFirebaseEvent();
    }
  };

  private handleBeforeUnload = async (event: BeforeUnloadEvent): Promise<void> => {
    this.logSessionEndFirebaseEvent();
    this.dispose();
  }

  private preloadGameAudios = async () => {
    let audioUrls = [
      "./assets/audios/intro.mp3",
      "./assets/audios/Cheering-02.mp3",
      "./assets/audios/Cheering-03.mp3",
      "./assets/audios/Cheering-01.mp3",
      "./assets/audios/onDrag.mp3",
      "./assets/audios/timeout.mp3",
      "./assets/audios/LevelWinFanfare.mp3",
      "./assets/audios/LevelLoseFanfare.mp3",
      "./assets/audios/ButtonClick.mp3",
      "./assets/audios/Monster Spits wrong stones-01.mp3",
      "./assets/audios/Disapointed-05.mp3",
      "./assets/audios/MonsterSpit.mp3",
      "./assets/audios/Eat.mp3",
      "./assets/audios/PointsAdd.wav",
      "./assets/audios/are-you-sure.mp3"
    ];

    return new Promise<void>((resolve, reject) => {
      const preloadPromises = audioUrls.map((audioSrc) => new AudioPlayer().preloadGameAudio(audioSrc));
      Promise.all(preloadPromises)
        .then(() => resolve())
        .catch((error) => {
          console.error("Error preloading audio:", error);
          reject(error);
        });
    });
  }

    // Add the dispose method
    public dispose(): void {
      this.channel.removeEventListener("message", this.handleServiceWorkerMessage);
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
      document.removeEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange);
      window.removeEventListener("resize", this.handleResize);
  
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", this.handleServiceWorkerMessage);
      }
  
      // Perform additional cleanup if necessary
    }
}

const app = new App(lang);

