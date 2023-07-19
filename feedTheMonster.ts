import * as Sentry from "@sentry/browser";
import { LevelSelectionScreen } from "./src/scenes/level-selection-scene";
import { getData } from "./src/data/api-data";
import { DataModal } from "./src/data/data-modal";
import { StartScene } from "./src/singlecanvas/scenes/start-scene";
import { SceneHandler } from "./src/singlecanvas/sceneHandler/scene-handler"
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
import { FirebaseIntegration } from "./src/firebase/firebase_integration";
declare const window: any;
declare const app: any;
let jsonData;

declare global {
  var descriptionText: string;
}
const channel = new BroadcastChannel("my-channel");
let is_cached = localStorage.getItem(IsCached)
  ? new Map(JSON.parse(localStorage.getItem(IsCached)))
  : new Map();
window.addEventListener("beforeunload", (event) => {
  FirebaseIntegration.sessionEnd();
});
window.addEventListener("load", async function () {
  registerWorkbox();
  const canvas: any = <HTMLElement>document.getElementById("canvas");
  canvas.height = window.innerHeight;
  canvas.width = window.screen.width > 420 ? 420 : window.innerWidth;
  let data = await getData();
  let d = new DataModal(
    data.title,
    data.OtherAudios,
    data.Levels,
    data.FeedbackTexts,
    data.RightToLeft,
    data.FeedbackAudios
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
      Debugger.DevelopmentLink
        ? (document.getElementById("toggle-btn").style.display = "block")
        : null;
      if (navigator.onLine) {
        FirebaseIntegration.initializeFirebase();
      }
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
    if (navigator.onLine) {
      FirebaseIntegration.initializeFirebase();
    }
    Debugger.DevelopmentLink
      ? (document.getElementById("toggle-btn").style.display = "block")
      : null;
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

channel.addEventListener('message',handleServiceWorkerMessage)

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
  document.getElementById("loading_number").innerHTML =
    " " + " downloading... " + data.data + "%";
  if (data.data % 100 == 0) {
    is_cached.set(lang, "true");
    localStorage.setItem(
      IsCached,
      JSON.stringify(Array.from(is_cached.entries()))
    );
    localStorage.setItem("version" + lang, data.version);
    window.location.reload();
  }
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
