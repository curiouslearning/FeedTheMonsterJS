import { DataModal } from "./data-modal.js";
import { lang } from "../../global-variables.js";

const URL = "./lang/" + lang + "/ftm_" + lang + ".json";
const channel = new BroadcastChannel("my-channel");

export function getFtmData() {
  channel.postMessage({
    command: "Recache",
    data: lang,
    version: localStorage.getItem("version" + lang),
  });
  return fetch(URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) =>
    res.json().then((data) => {
      return data;
    })
  );
}

export async function getData() {
  // let d = {
  //     "OtherAudios": null,
  //     "FeedbackTexts": null,
  //     "Levels": null,
  //     "FeedbackAudios": null,
  //     "RightToLeft": null
  // }
  return await getFtmData();
}
