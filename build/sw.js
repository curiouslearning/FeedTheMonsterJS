importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
workbox.precaching.precacheAndRoute([{"revision":"41ee52a13ec4becc8d52ca965face3dc","url":"feedTheMonster.js"},{"revision":"09bb61dacaa8b249581ad750f35869e2","url":"index.css"},{"revision":"1019bda598e9e2ab3289c7994b28729a","url":"index.html"},{"revision":"ae797974ddb3e3332e4e4aa403364538","url":"workers/feedback-text-worker.js"}], {
  ignoreURLParametersMatching: [/^cr_/],
  exclude: [/^lang\//],
});
var number = 0;
var version = 1.26;
// self.addEventListener('activate', function(e) {
//     console.log("activated");
//
//
// });

self.addEventListener("install", async function (e) {
  self.skipWaiting();
});
const channel = new BroadcastChannel("my-channel");
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
channel.addEventListener("message", async function (event) {
  if (event.data.command === "Cache") {
    number = 0;
    await getCacheName(event.data.data);
  }
  if (event.data.command === "CacheUpdate") {
    caches.delete(workbox.core.cacheNames.precache + event.data.data);
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

async function cacheLangAssets(file, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(file);

  if (!cachedResponse) {
    await cache.add(file);
    console.log('Cached File:', file);
  } else {
    console.log('File already cached, skipping:', file);
  }
}
async function getCacheName(language) {
  await caches.keys().then((cacheNames) => {
    cacheNames.forEach(async (cacheName) => {
      await getALLAudioUrls(cacheName, language);
    });
  });
}

async function getALLAudioUrls(cacheName, language) {
  let audioList = new Set(); // Use Set to filter duplicates
  audioList.add(`/lang/${language}/ftm_${language}.json`);
  fetch(`./lang/${language}/ftm_${language}.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) =>
    res.json().then(async (data) => {
      await cacheFeedBackAudio(data.FeedbackAudios, language);

      for (const level of data.Levels) {
        for (const puzzle of level.Puzzles) {
          let file = puzzle.prompt.PromptAudio;
          audioList.add(
            self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
              ? file.slice(0, file.indexOf("/feedthemonster") + "/feedthemonster".length) +
                "dev" + file.slice(file.indexOf("/feedthemonster") + "/feedthemonster".length)
              : file
          );
        }
      }
      cacheAudiosFiles(Array.from(audioList), language); // Convert Set back to array
    })
  );
}

async function cacheAudiosFiles(audioList, language) {
  const uniqueAudioURLs = [...new Set(audioList)]; // Ensuring the audioList has only unique values
  const percentageInterval = 10;
  const partSize = Math.ceil(uniqueAudioURLs.length / percentageInterval);
  const delayBetweenRequests = 800;
  const timeoutMultiplier = 0.6; // Adjust multiplier based on device performance
  const timeoutValue = 3000; // Adjust timeout value as needed (in milliseconds)

  for (let i = 0; i < percentageInterval; i++) {
    const startIndex = i * partSize;
    let endIndex = startIndex + partSize;
    if (i == percentageInterval - 1) {
      endIndex = uniqueAudioURLs.length;
    }
    const part = uniqueAudioURLs.slice(startIndex, endIndex);

    try {
      const cache = await caches.open(language);
      const timeoutPromises = part.map(async (url) => {
        try {
          const timeoutPromise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              clearTimeout(timeoutId);
              reject(new Error("Timeout while caching audio: " + url));
            }, timeoutValue * timeoutMultiplier);
          });
          console.log('Cached Audio files:', url);
          return Promise.race([timeoutPromise, cache.add(url)]);
        } catch (error) {
          console.error('Error caching audio:', url, error);
        }
      });

      await Promise.all(timeoutPromises);
    } catch (error) {
      console.error('Could not add audios:', error);
    } finally {
      await channel.postMessage({
        msg: "Loading",
        data: Math.min((i + 1) * percentageInterval, 100),
      });
    }

    await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
  }
}


async function cacheCommonAssets(language) {
  const assetUrls = [
    `./lang/${language}/audios/fantastic.WAV`,
    `./lang/${language}/audios/great.wav`,
    `./lang/${language}/images/fantastic_01.png`,
    `./lang/${language}/images/great_01.png`,
    `./lang/${language}/images/title.png`,
  ];

  const timeoutMultiplier = 1; // Adjust multiplier based on device performance
  const timeoutValue = 4000; // Adjust timeout value as needed (in milliseconds)

  try {
    const cacheName = language;
    const cache = await caches.open(cacheName);
    
    const timeoutPromises = assetUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Timeout while caching audio: " + url));
        }, timeoutValue * timeoutMultiplier);
        console.log('Cached Asset:', url);
        cache.add(url)
          .then(() => {
            clearTimeout(timeoutId);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });
    });

    await Promise.all(timeoutPromises);
  } catch (e) {
    console.log('Could not open cache:', e);
  }
}

async function cacheFeedBackAudio(feedBackAudios, language) {
  const audioUrls = [...new Set(feedBackAudios.map(audio => {
    return self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
      ? audio.replace("/feedthemonster", "/feedthemonsterdev")
      : audio;
  }))];

  const timeoutMultiplier = 0.6; // Adjust multiplier based on device performance
  const timeoutValue = 3000; // Adjust timeout value as needed (in milliseconds)

  try {
    const cacheName =  language;
    const cache = await caches.open(cacheName);

    await Promise.all(audioUrls.map(async (url) => {
      try {
        const timeoutPromise = new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            reject(new Error("Timeout while caching audio: " + url));
          }, timeoutValue * timeoutMultiplier);
        });

        await Promise.race([timeoutPromise, cache.add(url)]);
        console.log('Cached Feedback audio:', url);
      } catch (e) {
        console.log('Error caching audio:', url, e);
      }
    }));
  } catch (e) {
    console.log('Could not open cache:', e);
  }
}


self.addEventListener("fetch", function (event) {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.searchParams.has('cache-bust')) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

