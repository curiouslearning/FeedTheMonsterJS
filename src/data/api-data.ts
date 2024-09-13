import { lang } from "@common";

export const URL = "./lang/" + lang + "/ftm_" + lang + ".json";

export function getFtmData(shouldUseCacheBust: boolean) {
  if (shouldUseCacheBust) {
    console.log("using cacheBust");
    return fetch(URL + "?cache-bust=" + new Date().getTime(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      cache: "no-store",
    }).then((res) =>
      res.json().then((data) => {
        return data;
      })
    );
  } else {
    console.log("using normal fetch");
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
}

export async function getData(shouldUseCacheBust: boolean=false) {
  return await getFtmData(shouldUseCacheBust);
}
