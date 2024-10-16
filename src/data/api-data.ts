import { lang } from "@common";

export const URL = "./lang/" + lang + "/ftm_" + lang + ".json";

export function getFtmData() {
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
  return await getFtmData();
}
