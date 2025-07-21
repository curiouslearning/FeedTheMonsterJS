import * as Sentry from "@sentry/browser";
import { getData, DataModal, customFonts } from "@data";
import { SceneHandler } from "@sceneHandler/scene-handler";
import { AUDIO_URL_PRELOAD, IsCached, PreviousPlayedLevel } from "@constants";
import { FirebaseIntegration } from "./Firebase/firebase-integration";
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
} from "./Firebase/firebase-event-interface";
import { URL } from "@data";
import './styles/main.scss';
import { FeatureFlagsService } from '@curiouslearning/features';

const featureFlagService = new FeatureFlagsService({
  metaData: { userId: pseudoId }
});

declare const window: any;

class App {
  private canvas: HTMLCanvasElement;
  private riveCanvas: HTMLCanvasElement;
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
  private titleTextElement: HTMLElement | null;
  private feedBackTextElement: HTMLElement | null;
  public currentProgress: any;
  public background: HTMLElement | null;
  firebaseIntegration: FirebaseIntegration;
  private logged25: boolean = false;
  private logged50: boolean = false;
  private logged75: boolean = false;

  constructor(lang: string) {
    this.lang = lang;
    this.currentProgress = 25; // Initialize fake progress to 25%
    this.background = document.getElementById("background") as HTMLElement;
    this.channel = new BroadcastChannel("my-channel");
    this.progressBar = document.getElementById("progress-bar") as HTMLElement;
    this.titleTextElement = document.getElementById("title") as HTMLElement;
    this.feedBackTextElement = document.getElementById("feedback-text") as HTMLElement;
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
    this.startSessionTime = 0;
    this.init();
    window.addEventListener("beforeunload", this.handleBeforeUnload);
    document.addEventListener(VISIBILITY_CHANGE, this.handleVisibilityChange);
  }

  private async init() {
    // BOOKMARK: Initialize the Firebase Integration singleton.
    // This must be called once at app startup before any other Firebase methods.
    // This step makes sure that the analytics are initialized before any 
    // tracking is done.
    await FirebaseIntegration.initializeAnalytics();
    this.firebaseIntegration = FirebaseIntegration.getInstance();
    const font = await Utils.getLanguageSpecificFont(this.lang);
    await this.loadAndCacheFont(font, `./assets/fonts/${font}.ttf`);
    await this.loadTitleFeedbackCustomFont();
    await this.preloadGameAudios();
    await featureFlagService.initialize();
    
    // Setup canvas and load data first
    this.setupCanvas();
    const data = await getData();
    this.majVersion = data.majversion;
    this.minVersion = data.minversion;
    this.dataModal = this.createDataModal(data);
    this.globalInitialization(data);
    this.logSessionStartFirebaseEvent();
    
    // Initialize scene handler
    this.updateVersionInfoElement(this.dataModal);
    this.sceneHandler = new SceneHandler(this.dataModal);
    this.passingDataToContainer();
    
    // Hide loading screen after scene is initialized
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }
    
    // Setup event listeners
    window.addEventListener("resize", () => {
      this.handleResize(this.dataModal);
    });

    const playedInfo = localStorage.getItem(this.lang + "gamePlayedInfo");
    const nextPlayableLevel = playedInfo ? JSON.parse(playedInfo).length - 1 : 0;
    const storageKey = Debugger.DebugMode
      ? PreviousPlayedLevel + this.lang + "Debug"
      : PreviousPlayedLevel + this.lang;

    localStorage.setItem(storageKey, nextPlayableLevel.toString());
  }

  private async loadTitleFeedbackCustomFont() {
    const customTitleFeedbackFont = customFonts[this.lang] || customFonts.default;
    const fontFamily = `'${customTitleFeedbackFont}', sans-serif`;

    await this.loadAndCacheFont(customTitleFeedbackFont, `./assets/fonts/${customTitleFeedbackFont}.ttf`);
    [this.titleTextElement, this.feedBackTextElement].forEach(element => {
      if (element) {
        element.style.fontFamily = fontFamily;
      }
    });
  }
  private logDownloadPercentageComplete(percentage: number, timeDifferenceFromSessonStart: number) {
    const downloadCompleteData = {
      cr_user_id: pseudoId,
      ftm_language: lang,
      profile_number: 0,
      version_number: this.versionInfoElement.innerHTML,
      json_version_number: this.getJsonVersionNumber(),
      ms_since_session_start: timeDifferenceFromSessonStart,
    };

    switch (percentage) {
      case 25:
        this.firebaseIntegration.sendDownload25PercentCompletedEvent(downloadCompleteData);
        break;
      case 50:
        this.firebaseIntegration.sendDownload50PercentCompletedEvent(downloadCompleteData);
        break;
      case 75:
        this.firebaseIntegration.sendDownload75PercentCompletedEvent(downloadCompleteData);
        break;
      case 100:
        this.firebaseIntegration.sendDownloadCompletedEvent(downloadCompleteData);
        break;
      default:
        console.warn(`Unsupported progress percentage: ${percentage}`);
    }
    if ((percentage === 25 && this.logged25) ||
      (percentage === 50 && this.logged50) ||
      (percentage === 75 && this.logged75)) {
      return;
    }; // Event already logged, no need to send again }
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

  private setupCanvas() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.riveCanvas = document.getElementById("rivecanvas") as HTMLCanvasElement;
    let gameWidth: number = Utils.getResponsiveCanvasWidth();
    this.canvas.height = window.innerHeight;
    this.canvas.width = gameWidth;
    this.riveCanvas.height = window.innerHeight;
    this.riveCanvas.width = gameWidth;
    this.background.style.width = `${gameWidth}px`;
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
    const isDevOrTestEnv = this.is_cached.has(this.lang) && (Debugger.TestLink || Debugger.DevelopmentLink || Debugger.DebugMode);
    
    // Update version info when in development/test environment
    if (isDevOrTestEnv) {
      if (dataModal.majVersion && dataModal.minVersion) {
        this.versionInfoElement.innerHTML += `/j.v${dataModal.majVersion}.${dataModal.minVersion}`;
      } else if (dataModal.version) {
        this.versionInfoElement.innerHTML += `/j.v${dataModal.version}`;
      }
    }
    
    // Set toggle button visibility - show in development/test environment or when debug mode is enabled
    const toggleBtn = document.getElementById("toggle-btn");
    if (toggleBtn) {
      toggleBtn.style.display = (isDevOrTestEnv) ? "block" : "none";
    }
  }

  private reinitializeSceneHandler(dataModal: DataModal): void {
    if (this.sceneHandler) {
      this.sceneHandler.dispose();
    }
    delete this.sceneHandler;
    this.sceneHandler = new SceneHandler(dataModal);
    this.passingDataToContainer();
  }

  private handleCachedScenario(dataModal: DataModal): void {
    this.updateVersionInfoElement(dataModal);
    this.sceneHandler = new SceneHandler(dataModal);
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

  private handleLoadingMessage = (data: { data: number; version: string }): void => {
    if (this.progressBarContainer && this.progressBar) {
      this.showProgressBar();
      let ms_since_session_start = Date.now() - this.startSessionTime
      const progressValue = Math.min(100, Math.max(0, data.data)); // Ensure progress is between 0 and 100
      // Only update if new progress is greater than the current progress
      if (progressValue > this.currentProgress) {
        this.currentProgress = progressValue;
        this.progressBar.style.width = `${this.currentProgress}%`;
        // Log events only once when progress crosses thresholds
        if (this.currentProgress >= 25 && !this.logged25) {
          this.logDownloadPercentageComplete(25, ms_since_session_start);
          this.logged25 = true;
        }
        if (this.currentProgress >= 50 && !this.logged50) {
          this.logDownloadPercentageComplete(50, ms_since_session_start);
          this.logged50 = true;
        }
        if (this.currentProgress >= 75 && !this.logged75) {
          this.logDownloadPercentageComplete(75, ms_since_session_start);
          this.logged75 = true;
        }

        // Check if download completed
        if (this.isDownloadCompleted(this.currentProgress)) {
          this.cacheLanguage();
          this.logDownloadPercentageComplete(100, ms_since_session_start);
          this.hideLoadingScreen();
        }
      }
    }
  };

  //Shows the progress bar.
  showProgressBar() {
    this.progressBarContainer.classList.add("visible");
    this.progressBar.classList.add("visible");
  }

  //Checks if download is completed.
  isDownloadCompleted(progress) {
    return progress === 100 && !this.is_cached.get(this.lang);
  }
  //Handles caching.
  cacheLanguage() {
    try {
      this.is_cached.set(this.lang, true);
      localStorage.setItem(IsCached, JSON.stringify(Array.from(this.is_cached.entries())));
    } catch (error) {
      console.error("Error caching language:", error);
    }
  }

  getJsonVersionNumber() {
    return !!this.majVersion && !!this.minVersion
      ? this.majVersion + "." + this.minVersion
      : "";
  }
  //Hides the loading screen.
  hideLoadingScreen() {
    try {
      localStorage.setItem("version" + this.lang, this.getJsonVersionNumber());
      this.handleResize(this.dataModal);
    } catch (error) {
      console.error("Error hiding loading screen:", error);
    }
  }

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
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    document.removeEventListener(
      VISIBILITY_CHANGE,
      this.handleVisibilityChange
    );
    window.removeEventListener("resize", this.handleResize);
  }
}

const app = new App(lang);
