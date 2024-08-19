const urlParams = new URLSearchParams(window.location.search);

import { DevelopmentServer } from "./src/constants/";
import { Utils } from "./src/common/utils";

export var pseudoId = urlParams.get("cr_user_id");

export var lang =
  urlParams.get("cr_lang") == null ? "english" : urlParams.get("cr_lang");

  export const font = Utils.getLanguageSpecificFont(lang);
export const Debugger = {
  DevelopmentLink: window.location.href.includes(DevelopmentServer)
    ? true
    : false,
  DebugMode: false,
};
declare global {
  interface Window {
    feedbackTextWorkerPath: string;
  }
}

window.feedbackTextWorkerPath = './workers/feedback-text-worker.js';

export interface Window {
  webkitAudioContext?: typeof AudioContext;
}

