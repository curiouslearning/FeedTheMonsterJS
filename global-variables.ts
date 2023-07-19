const urlParams = new URLSearchParams(window.location.search);

import { DevelopmentServer } from "./src/common/common";

export var pseudoId = urlParams.get("cr_user_id");

export var lang =
  urlParams.get("cr_lang") == null ? "english" : urlParams.get("cr_lang");
export const Debugger = {
  DevelopmentLink: window.location.href.includes(DevelopmentServer)
    ? true
    : false,
  DebugMode: false,
};
