import * as Sentry from "@sentry/browser";
import { getData, DataModal } from "@data";
import { SceneHandler } from "@sceneHandler";
import { AUDIO_URL_PRELOAD, IsCached } from "@constants";
import { Workbox } from "workbox-window";
import { FirebaseIntegration } from "./src/Firebase/firebase-integration";
import {
  Utils,
  VISIBILITY_CHANGE,
  Debugger,
  lang,
  pseudoId,
  isDocumentVisible,
} from "@common";
import { AudioPlayer } from "@components";
import {
  SessionStart,
  SessionEnd,
  DownloadCompleted,
} from "./src/Firebase/firebase-event-interface";
import { URL } from "@data";
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
  private majVersion: string;
  private minVersion: string;
  private dataModal: DataModal;
  private startSessionTime: number;
  firebaseIntegration: FirebaseIntegration;
  constructor(lang: string) {
    this.lang = lang;
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.channel = new BroadcastChannel("my-channel");
    this.progressBar = document.getElementById("progress-bar") as HTMLElement;
    this.progressBarContainer = document.getElementById(
      "progress-bar-container"
    ) as HTMLElement;
    this.versionInfoElement = document.getElementById(
      "version-info-id"
    ) as HTMLElement;
    this.loadingElement = document.getElementById(
      "loading-screen"
    ) as HTMLElement;
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
    console.log("init");
    const font = await Utils.getLanguageSpecificFont(this.lang);
    await this.loadAndCacheFont(font, `./assets/fonts/${font}.ttf`);
    await this.preloadGameAudios();
    this.handleLoadingScreen();
    this.setupCanvas();
    const isCachedFlag = this.is_cached.has(this.lang);
    const data = await getData(!isCachedFlag);
    this.majVersion = data.majversion;
    this.minVersion = data.minversion;
    console.log("Data initialized");
    console.log(this.majVersion+"."+this.minVersion);
    this.dataModal = this.createDataModal(data);
    this.globalInitialization(data);
    this.logSessionStartFirebaseEvent();
    window.addEventListener("resize", async () => {
      this.handleResize(this.dataModal);
    });

    if (this.is_cached.has(this.lang)) {
      this.handleCachedScenario(this.dataModal);
    }
    this.registerWorkbox();
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
      json_version_number:
        !!this.majVersion && !!this.minVersion
          ? this.majVersion.toString() + "." + this.minVersion.toString()
          : "",
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
      json_version_number:
        !!this.majVersion && !!this.minVersion
          ? this.majVersion.toString() + "." + this.minVersion.toString()
          : "",
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
      const cache = await caches.open("fontCache");
      const response = await cache.match(fontPath);
      if (!response) {
        const fontResponse = await fetch(fontPath);
        const fontBlob = await fontResponse.blob();
        await cache.put(fontPath, new Response(fontBlob));
      }
      const font = new FontFace(
        fontName,
        `url(${fontPath}) format('truetype')`
      );
      await font.load();
      document.fonts.add(font);
    } catch (error) {
      console.error(`Failed to load and cache font: ${error}`);
    }
  }

  private handleLoadingScreen = () => {
    if (this.is_cached.get(lang)) {
      this.loadingElement.style.zIndex = "-1";
      this.loadingElement.style.display = "none";
      this.progressBarContainer.style.display = "none";
      this.progressBar.style.display = "none";
    } else {
      this.progressBarContainer.style.display = "flex";
      this.progressBar.style.display = "flex";
      this.progressBar.style.width = "30%";
    }
  };

  private async registerWorkbox(): Promise<void> {
    if ("serviceWorker" in navigator) {
      try {
        const wb = new Workbox("./sw.js", {});
        await wb.register();
        await navigator.serviceWorker.ready;
        console.log("is_cached>");
        for (const [key, value] of this.is_cached) {
          console.log(key, value);
        }
        if (!this.is_cached.has(this.lang)) {
          this.channel.postMessage({ command: "Cache", data: this.lang });
        } else {
          fetch(URL + "?cache-bust=" + new Date().getTime(), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
            cache: "no-store",
          })
            .then(async (response) => {
              if (!response.ok) {
                console.error(
                  "Failed to fetch the content file from the server!"
                );
                return;
              }
              const newContentFileData = await response.json();
              console.log(newContentFileData);
              const aheadContentVersion =
                newContentFileData["majversion"] +
                "." +
                newContentFileData["minversion"];
              const cachedVersion = localStorage.getItem(
                "version" + lang.toLowerCase()
              );
              console.log("No Cache Content version: " + aheadContentVersion);
              console.log("cached version :" + cachedVersion);
              // We need to check here for the content version updates
              // If there's a new content version, we need to remove the cached content and reload
              // We are comparing here the contentVersion with the aheadContentVersion
              if (aheadContentVersion && cachedVersion != aheadContentVersion) {
                console.log("version mismatch found, deleting cache");
                this.channel.postMessage({ command: "delete-cache", data: this.lang });
                // this.handleUpdateFoundMessage();
              }
            })
            .catch((error) => {
              console.error("Error fetching the content file: " + error);
            });
        }
        navigator.serviceWorker.addEventListener(
          "message",
          this.handleServiceWorkerMessage
        );
      } catch (error) {
        console.error(`Failed to register service worker: ${error}`);
      }
    }
  }

  private setupCanvas() {
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.screen.width > 1080 ? 768 : window.innerWidth;
  }

  private createDataModal(data: any): DataModal {
    return new DataModal(
      data.title,
      data.OtherAudios,
      data.Levels,
      data.FeedbackTexts,
      data.RightToLeft,
      data.FeedbackAudios,
      data.majversion,
      data.minversion,
      data.version
    );
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
  };

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

  private handleLoadingMessage = (data: {
    data: number;
    version: string;
  }): void => {
    if (this.progressBarContainer && this.progressBar) {
      this.progressBarContainer.style.display = "flex";
      this.progressBar.style.display = "flex";

      if (parseInt(this.progressBar.style.width || "0") >= 40) {
        this.progressBar.style.width = `${data.data}%`;
      }

      if (data.data % 100 === 0 && !this.is_cached.get(this.lang)) {
        this.is_cached.set(this.lang, true);
        localStorage.setItem(
          IsCached,
          JSON.stringify(Array.from(this.is_cached.entries()))
        );
        const download_completed: DownloadCompleted = {
          cr_user_id: pseudoId,
          ftm_language: lang,
          profile_number: 0,
          version_number: this.versionInfoElement.innerHTML,
          json_version_number:
            !!this.majVersion && !!this.minVersion
              ? this.majVersion.toString() + "." + this.minVersion.toString()
              : "",
        };
        this.firebaseIntegration.sendDownloadCompletedEvent(download_completed);
        localStorage.setItem(
          "version" + this.lang,
          this.majVersion + "." + this.minVersion
        );
        // window.location.reload();
        this.loadingElement.style.display = "none";
        this.handleResize(this.dataModal);
        console.log("hide progress");
      }
      this.progressBar.style.width = `${data.data}%`;
    }
  };

  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    if (event.data.msg === "Loading") {
      this.handleLoadingMessage(event.data);
    } else if (event.data.msg === "Update Found") {
      this.handleUpdateFoundMessage();
    }else if (event.data.msg === 'Cache-deleted'){
      // console.log("Content version mismatch! Reloading...");
      var cachedItem = JSON.parse(localStorage.getItem("is_cached"));
      console.log("current lang  " + lang);
      var newCachedItem = cachedItem.filter(
        (e) => !e.toString().includes(lang)
      );
      localStorage.setItem(IsCached, JSON.stringify(newCachedItem));
      localStorage.removeItem("version" + lang.toLowerCase());
      // Clear the cache for tht particular content
      // await caches.delete(lang);
      this.handleUpdateFoundMessage();
    }
  };

  private handleVisibilityChange = () => {
    if (isDocumentVisible()) {
      this.logSessionStartFirebaseEvent();
    } else {
      this.logSessionEndFirebaseEvent();
    }
  };

  private handleBeforeUnload = async (
    event: BeforeUnloadEvent
  ): Promise<void> => {
    this.logSessionEndFirebaseEvent();
    this.dispose();
  };

  private preloadGameAudios = async () => {
    let audioUrls = AUDIO_URL_PRELOAD;

    return new Promise<void>((resolve, reject) => {
      const preloadPromises = audioUrls.map((audioSrc) =>
        new AudioPlayer().preloadGameAudio(audioSrc)
      );
      Promise.all(preloadPromises)
        .then(() => resolve())
        .catch((error) => {
          console.error("Error preloading audio:", error);
          reject(error);
        });
    });
  };

  // Add the dispose method
  public dispose(): void {
    this.channel.removeEventListener(
      "message",
      this.handleServiceWorkerMessage
    );
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange
    );
    window.removeEventListener("resize", this.handleResize);

    if (navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener(
        "message",
        this.handleServiceWorkerMessage
      );
    }

    // Perform additional cleanup if necessary
  }
}

const app = new App(lang);