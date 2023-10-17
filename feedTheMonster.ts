import * as Sentry from "@sentry/browser";
import { LevelSelectionScreen } from "./src/scenes/level-selection-scene";
import { getData } from "./src/data/api-data";
import { DataModal } from "./src/data/data-modal";
import { StartScene } from "./src/singlecanvas/scenes/start-scene";
import { SceneHandler } from "./src/singlecanvas/sceneHandler/scene-handler";
import { CanvasStack } from "./src/utility/canvas-stack";
import { firebaseConfig } from "./src/firebase/firebase_config";
import {
  getDatafromStorage,
  ProfileData,
  setDataToStorage,
} from "./src/data/profile-data";
import { IsCached, PWAInstallStatus } from "./src/common/common";
import { Workbox } from "workbox-window";
import { Debugger, lang } from "./global-variables";
import { FirebaseIntegration } from "./src/singlecanvas/Firebase/firebase-integration";
import { Utils } from "./src/singlecanvas/common/utils";
import { resolve } from "path";
import { AudioPlayer } from "./src/singlecanvas/components/audio-player";
declare const window: any;
declare const app: any;
let jsonData;
const progressBar=document.getElementById("progress-bar");
const preogressBarContainer=document.getElementById("progress-bar-container");
declare global {
  var descriptionText: string;
}
const channel = new BroadcastChannel("my-channel");
let is_cached = localStorage.getItem(IsCached)
  ? new Map(JSON.parse(localStorage.getItem(IsCached)))
  : new Map();
window.addEventListener("beforeunload", (event) => {
  // FirebaseIntegration.sessionEnd();
  FirebaseIntegration.getInstance().sendSessionEndEvent();
});
window.addEventListener("load", async function () {
  const font = Utils.getLanguageSpecificFont(lang);
  await loadAndCacheFont(font, `./assets/fonts/${font}.ttf`);
  await preloadGameAudios();
  handleLoadingScreen();
  // setContainerAppOrientation()
  registerWorkbox();
  const canvas: any = <HTMLElement>document.getElementById("canvas");
  const versionInfoElement = document.getElementById("version-info-id");
  canvas.height = window.innerHeight;
  canvas.width = window.screen.width > 420 ? 420 : window.innerWidth;
  let data = await getData();
  let d = new DataModal(
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
  // if (window.Android) {
  //   window.Android.cachedStatus(
  //     is_cached.has(lang) ? is_cached.get(lang) : null
  //   );
  // }
  globalThis.aboutCompany = data.aboutCompany;
  globalThis.descriptionText = data.descriptionText;

  window.addEventListener("resize", async () => {
    if (is_cached.has(lang)) {
      if (Debugger.DevelopmentLink) {
        if (d.majVersion && d.minVersion) {
          versionInfoElement.innerHTML += `/j.v${d.majVersion}.${d.minVersion}`;
        } else if (d.version) {
          versionInfoElement.innerHTML += `/j.v${d.version}`;
        }
        document.getElementById("toggle-btn").style.display = "block";
      }
      // if (navigator.onLine) {
      //   FirebaseIntegration.initializeFirebase();
      // }
      canvas.height = window.innerHeight;
      canvas.width = window.screen.width > 420 ? 420 : window.innerWidth;
      delete this.monster;
      new CanvasStack("canvas").deleteAllLayers();
      delete this.sceneHandler;
      this.sceneHandler = new SceneHandler(canvas, d, this.analytics);
      passingDataToContainer();
    }
  });
  if (is_cached.has(lang)) {
    // if (navigator.onLine) {
    //   FirebaseIntegration.initializeFirebase();
    // }
    if (Debugger.DevelopmentLink) {
      if (d.majVersion && d.minVersion) {
        versionInfoElement.innerHTML += `/j.v${d.majVersion}.${d.minVersion}`;
      } else if (d.version) {
        versionInfoElement.innerHTML += `/j.v${d.version}`;
      }
      document.getElementById("toggle-btn").style.display = "block";
    }
    this.sceneHandler = new SceneHandler(canvas, d, this.analytics);
    passingDataToContainer();
  }
});
Sentry.init({
  dsn: "https://b9be4420e3f449bdb00a0ac861357746@o4504951275651072.ingest.sentry.io/4504951279058944",
  integrations: [new Sentry.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
async function registerWorkbox(): Promise<void> {
  if ("serviceWorker" in navigator) {
    let wb = new Workbox("./sw.js", {});
    await wb.register();
    await navigator.serviceWorker.ready;
    if (!is_cached.has(lang)) {
      await channel.postMessage({ command: "Cache", data: lang });
    }
    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage
    );
  }
}

channel.addEventListener("message", handleServiceWorkerMessage);

function handleServiceWorkerRegistration(registration): void {
  if (registration.installing) {
    registration.installing.postMessage({
      type: "Registration",
      value: lang,
    });
  }
}
function handleServiceWorkerMessage(event): void {
  if (event.data.msg == "Loading") {
    handleLoadingMessage(event.data);
  }
  if (event.data.msg == "Update Found") {
    handleUpdateFoundMessage();
  }
}

function handleLoadingMessage(data): void {
   preogressBarContainer.style.display="flex";
   progressBar.style.display="flex";
  
  if(progressBar.style.width>="40%"){
   
  progressBar.style.width=`${data.data}%`;
  }
  if (data.data % 100 == 0) {
    
    is_cached.set(lang, "true");
    localStorage.setItem(
      IsCached,
      JSON.stringify(Array.from(is_cached.entries()))
    );
    localStorage.setItem("version" + lang, data.version);
    window.location.reload();
  }
  progressBar.style.width=`${data.data}%`;
}
function handleUpdateFoundMessage(): void {
  let text = "Update Found\nPress ok to update.";
  if (confirm(text) == true) {
    // localStorage.removeItem(IsCached);
    // setTimeout(()=>{
    window.location.reload();
    // },3000)
  } else {
    text = "You canceled!";
  }
}
function passingDataToContainer() {
  if (window.Android) {
    window.Android.cachedStatus(is_cached.get(lang) == "true" ? true : false);
  }
}

function setContainerAppOrientation() {
  if (window.Android) {
    window.Android.setContainerAppOrientation("portrait");
  }
}

function handleLoadingScreen(){
  if(is_cached.get(lang)){
    preogressBarContainer.style.display="none";
    progressBar.style.display="none";
  }else{
    preogressBarContainer.style.display="flex";
    progressBar.style.display="flex";
    progressBar.style.width="30%";
  }

}

async function loadAndCacheFont(fontName, fontPath) {
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

async function preloadGameAudios() {
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
