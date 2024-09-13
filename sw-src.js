importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST, {
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
  // self.addEventListener("message", async (event) => {
  //   console.log("message event inside install event");
  //   console.log("Type->", event.data.type);
  //   if (event.data.type === "Registration") {
  //     if (!!!caches.keys().length) {
  //       number = 0;
  //       let cacheName = await getCacheName(event.data.value);
  //     } // The value passed from the main JavaScript file
  //   }
  // });
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
  if(event.data.command === "delete-cache"){
    console.log('Cache deleted in progress', event.data.data);
    caches.open(event.data.data)
    caches.open(cacheName)
    .then(cache => {
      return cache.keys()
        .then(keys => {
          return Promise.all(keys.map(key => cache.delete(key)));
        })
        .then(() => {
          console.log(`Cache '${event.data.data}' has been cleared`);
          console.log(`Cache '${cacheName}' has been cleared`);
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) =>
              client.postMessage({ msg: "Cache-deleted" })
            );
          });
        });
    });
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
// async function cacheAudiosFiles(file, cacheName, length) {
//   ///awt
//   await caches.open(cacheName).then(function (cache) {
//     cache
//       .add(
        // self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
        //   ? file.slice(
        //       0,
        //       file.indexOf("/feedthemonster") + "/feedthemonster".length
        //     ) +
        //       "dev" +
        //       file.slice(
        //         file.indexOf("/feedthemonster") + "/feedthemonster".length
        //       )
        //   : file
//       )
//       .finally(() => {
//         number = number + 1;
//         self.clients.matchAll().then((clients) => {
//           clients.forEach((client) => {
//             if ((number / (length * 5)) * 100 < 101) {
//               client.postMessage({
//                 msg: "Loading",
//                 data: Math.round((number / (length * 5)) * 100),
//               });
//             } else {
//               client.postMessage({
//                 msg: "Loading",
//                 data: Math.round(100),
//               });
//             }
//           });
//         });
//       });
//   });
// }
async function cacheLangAssets(file, cacheName) {
  await caches.open(cacheName).then((cache) => {
    cache.add(file);
  });
}
async function getCacheName(language) {
  ///awt
 await caches.keys().then((cacheNames) => {
    cacheNames.forEach(async (cacheName) => {
      await getALLAudioUrls(cacheName, language);
    });
  });
}

async function getALLAudioUrls(cacheName, language) {
  // await cacheCommonAssets(language);
  let audioList = [];
  audioList.push("/lang/" + language + "/ftm_" + language + ".json");
  fetch("./lang/" + language + "/ftm_" + language + ".json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) =>
    res.json().then(async (data) => {
      await cacheFeedBackAudio(data.FeedbackAudios,language);
      for (var i = 0; i < data.Levels.length; i++) {
        

        data.Levels[i].Puzzles.forEach(async (element) => {
          let file = element.prompt.PromptAudio;
          // audioList.push(element.prompt.PromptAudio)
          audioList.push(
          self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
          ? file.slice(
              0,
              file.indexOf("/feedthemonster") + "/feedthemonster".length
            ) +
              "dev" +
              file.slice(
                file.indexOf("/feedthemonster") + "/feedthemonster".length
              )
          : file);
        //  await cacheAudiosFiles(
        //     element.prompt.PromptAudio,
        //     workbox.core.cacheNames.precache + language,
        //     data.Levels.length
        //   );
        });
      }
    cacheAudiosFiles(audioList,language);
    })
  );
}

async function cacheAudiosFiles(audioList, language) {
  const uniqueAudioURLs = [...new Set(audioList)];
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
    // await Promise.all(assetUrls.map(async (url) => {
      // try {
        
      //     // return cache.add(url)
      //   // const timeoutPromise = new Promise((resolve, reject) => {
      //   //   const timeoutId = setTimeout(() => {
      //   //     clearTimeout(timeoutId);
      //   //     reject(new Error("Timeout while caching asset: " + url));
      //   //   }, timeoutValue * timeoutMultiplier);
      //   // });

      //   // await Promise.race([timeoutPromise, cache.add(url)]);
      //   // console.log('Cached:', url);
      // } catch (e) {
      //   console.log('Error caching asset:', url, e);
      // }
    // }));
  } catch (e) {
    console.log('Could not open cache:', e);
  }
}

async function cacheFeedBackAudio(feedBackAudios, language) {
  const audioUrls = feedBackAudios.map(audio => {
    return self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
      ? audio.replace("/feedthemonster", "/feedthemonsterdev")
      : audio;
  });

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
        console.log('Cached:', url);
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

