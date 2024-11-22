const urlParams = new URLSearchParams(window.location.search);

import { DevelopmentServer } from "@constants";
import { Utils } from "@common";

export var pseudoId = urlParams.get("cr_user_id");
export var source = urlParams.get("source") == null ? null : urlParams.get("source");
export var campaign_id = urlParams.get("campaign_id") == null ? null : urlParams.get("campaign_id");

export var lang =
  urlParams.get("cr_lang") == null ? "english" : urlParams.get("cr_lang");

export const font = Utils.getLanguageSpecificFont(lang);
export const Debugger = {
  DevelopmentLink: true,
  DebugMode: false,
};

export interface Window {
  webkitAudioContext?: typeof AudioContext;
}
