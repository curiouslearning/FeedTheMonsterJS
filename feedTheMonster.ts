import * as Sentry from "@sentry/browser";
import { getData } from "./src/data/api-data";
import { DataModal } from "./src/data/data-modal";
import { SceneHandler } from "./src/sceneHandler/scene-handler";
import { IsCached } from "./src/common/common";
import { Workbox } from "workbox-window";
import { Debugger, lang } from "./global-variables";
import { FirebaseIntegration } from "./src/Firebase/firebase-integration";
import { Utils } from "./src/common/utils";
import { AudioPlayer } from "./src/components/audio-player";
import { SessionStart,
SessionEnd
} from "./src/Firebase/firebase-event-interface";
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
  private jsonVersionNumber: string;
  constructor(lang: string) {
    this.lang = lang;
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.channel = new BroadcastChannel("my-channel");
    this.progressBar = document.getElementById("progress-bar") as HTMLElement;
    this.progressBarContainer = document.getElementById("progress-bar-container") as HTMLElement;
    this.versionInfoElement = document.getElementById("version-info-id") as HTMLElement;
    this.loadingElement = document.getElementById('loading-screen') as HTMLElement;
    this.is_cached = this.initializeCachedData();
    this.channel.addEventListener("message", this.handleServiceWorkerMessage);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
    this.jsonVersionNumber;
    this.init();
  }
   
  private async init() {
    const font = Utils.getLanguageSpecificFont(this.lang);
    await this.loadAndCacheFont(font, `./assets/fonts/${font}.ttf`);
    await this.preloadGameAudios();
    this.handleLoadingScreen();
    this.registerWorkbox();
    this.setupCanvas();
    const data = await getData();
    const dataModal = this.createDataModal(data);
    this.globalInitialization(data);
    
    window.addEventListener("resize", async () => {
      this.handleResize(dataModal);
    });

    if (this.is_cached.has(this.lang)) {
      this.handleCachedScenario(dataModal);
    }
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
        
        const font = new FontFace(fontName, `url(${fontPath}) format('truetype')`);
        await font.load();
        document.fonts.add(font);
      } else {
        const font = new FontFace(fontName, `url(${fontPath}) format('truetype')`);
        await font.load();
        document.fonts.add(font);
      }
    } catch (error) {
      console.error(`Failed to load and cache font: ${error}`);
    }
  }

  private handleLoadingScreen = () => {
    if(this.is_cached.get(lang)){
      this.loadingElement.style.zIndex = '-1';
      this.loadingElement.style.display = 'none';
      this.progressBarContainer.style.display="none";
      this.progressBar.style.display="none";
    }else{
      this.progressBarContainer.style.display="flex";
      this.progressBar.style.display="flex";
      this.progressBar.style.width="30%";
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
    this.canvas.width = window.screen.width > 420 ? 420 : window.innerWidth;
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
      if (this.is_cached.get(this.lang) == true) {
        window.Android.cachedStatus(true);
      } else {
        window.Android.cachedStatus(false);
      }
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
    } else {
      text = "You canceled!";
    }
  }

  private handleLoadingMessage = (data: { data: number, version: string }): void => {
    if (this.progressBarContainer && this.progressBar) {
      this.progressBarContainer.style.display = "flex";
      this.progressBar.style.display = "flex";

      if (parseInt(this.progressBar.style.width || "0") >= 40) {
        this.progressBar.style.width = `${data.data}%`;
      }

      if (data.data % 100 === 0) {
        this.is_cached.set(this.lang, true);
        localStorage.setItem(
          IsCached,
          JSON.stringify(Array.from(this.is_cached.entries()))
        );
        localStorage.setItem("version" + this.lang, data.version);
        window.location.reload();
      }
      this.progressBar.style.width = `${data.data}%`;
    }
  }

  private handleServiceWorkerRegistration = (registration: ServiceWorkerRegistration): void => {
    if (registration.installing) {
      registration.installing.postMessage({
        type: "Registration",
        value: this.lang,
      });
    }
  }

  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    if (event.data.msg === "Loading") {
      this.handleLoadingMessage(event.data);
    } else if (event.data.msg === "Update Found") {
      this.handleUpdateFoundMessage();
    }
  }

  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    FirebaseIntegration.getInstance().sendSessionEndEvent();
  }

  private preloadGameAudios = async() => {
    let audioUrls = [
      "./assets/audios/intro.mp3",
      "./assets/audios/Cheering-02.mp3",
      "./assets/audios/onDrag.mp3",
      "./assets/audios/timeout.mp3",
      "./assets/audios/LevelWinFanfare.mp3",
      "./assets/audios/LevelLoseFanfare.mp3",
      "./assets/audios/ButtonClick.mp3",
      "./assets/audios/Monster Spits wrong stones-01.mp3",
      "./assets/audios/Disapointed-05.mp3",
      "./assets/audios/MonsterSpit.mp3",
      "./assets/audios/Eat.mp3",
    ];
  
    return new Promise<void>((resolve, reject) => {
      const preloadPromises = audioUrls.map((audioSrc) => new AudioPlayer().preloadGameAudio(audioSrc));
      
      Promise.all(preloadPromises)
        .then(() => {
          console.log("All Game audios files have been preloaded and are ready to use.");
          resolve();
        })
        .catch((error) => {
          console.error("Error preloading audio:", error);
          reject(error);
        });
    });
  }
  
}

const app = new App(lang);

