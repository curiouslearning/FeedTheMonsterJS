importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST, {
  ignoreURLParametersMatching: [/^cr_/],
  exclude: [/^lang\//],
});
var number = 0;
var version = 1.1;
// self.addEventListener('activate', function(e) {
//     console.log("activated");
//
//
// });
self.addEventListener("install", async function (e) {
  self.addEventListener("message", async (event) => {
    if (event.data.type === "Registration") {
      if (!!!caches.keys().length) {
        number = 0;
        let cacheName = await getCacheName(event.data.value);
      } // The value passed from the main JavaScript file
    }
  });
  self.skipWaiting();
});
const channel = new BroadcastChannel("my-channel");
self.addEventListener("activate", function (event) {
  console.log("Service worker activated");
  event.waitUntil(self.clients.claim());
});
channel.addEventListener("message", async function (event) {
  if (event.data.command === "Cache") {
    number = 0;
    await getCacheName(event.data.data);
  }
});

self.registration.addEventListener("updatefound", function (e) {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      if (cacheName == workbox.core.cacheNames.precache) {
        // caches.delete(cacheName);
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ msg: "Update Found" })
          );
        });
      }
    });
  });
});
function cacheAudiosFiles(file, cacheName, length) {
  caches.open(cacheName).then(function (cache) {
    cache.add(file).finally(() => {
      number = number + 1;
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({
            msg: "Loading",
            data: Math.round((number / (length * 5)) * 100),
          })
        );
      });
    });
  });
}
function cacheLangAssets(file, cacheName) {
  caches.open(cacheName).then((cache) => {
    cache.add(file);
  });
}
function getCacheName(language) {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      getALLAudioUrls(cacheName, language);
    });
  });
}

function getALLAudioUrls(cacheName, language) {
  [
    "./lang/" + language + "/audios/fantastic.WAV",
    "./lang/" + language + "/audios/great.wav",
    "./lang/" + language + "/images/fantastic_01.png",
    "./lang/" + language + "/images/great_01.png",
    "./lang/" + language + "/images/title.png",
    "./lang/" + language + "/ftm_" + language + ".json",
  ].forEach((res) => {
    cacheLangAssets(res, workbox.core.cacheNames.precache + language);
  });

  fetch("./lang/" + language + "/ftm_" + language + ".json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) =>
    res.json().then((data) => {
      for (var i = 0; i < data.Levels.length; i++) {
        data.Levels[i].Puzzles.forEach((element) => {
          cacheAudiosFiles(
            element.prompt.PromptAudio,
            workbox.core.cacheNames.precache + language,
            data.Levels.length
          );
        });
      }
    })
  );
}
channel.addEventListener("message", function (value) {
  self.addEventListener("fetch", function (event) {
    if (
      value.data.command === "Recache" &&
      event.request.url.includes(".json")
    ) {
      fetch(event.request.url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) =>
        res.json().then((data) => {
          if (
            data.version != value.data.version &&
            value.data.version != null
          ) {
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                  client.postMessage({
                    msg: "Recache",
                    data: "versionUpdated",
                  });
              });
            });
          }
          // return data;
        })
      );
    }
    // if()
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
    );
  });
});
