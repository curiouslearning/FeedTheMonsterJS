importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
workbox.precaching.precacheAndRoute([{"revision":"ec214e1eef89105b484900ac15d92649","url":"assets/audios/ButtonClick.mp3"},{"revision":"ec214e1eef89105b484900ac15d92649","url":"assets/audios/ButtonClick.wav"},{"revision":"53a8bfd7392adf8910b433ce13ab4af0","url":"assets/audios/Cheering-02.mp3"},{"revision":"2431a6bb00bfeecfb2d5404bdd087b24","url":"assets/audios/Disapointed-05.mp3"},{"revision":"5ef47da84396ad9a4b83235b87211c04","url":"assets/audios/Eat.mp3"},{"revision":"f27755d5596c69afa238221f75a19afe","url":"assets/audios/fantastic.WAV"},{"revision":"f3349f9e400da37876c81913c0be026e","url":"assets/audios/good job.WAV"},{"revision":"54e68bba98cc48aa41ab13a27f36ae96","url":"assets/audios/great.wav"},{"revision":"21a9071743deb5ef58f5a44ced6ec3ac","url":"assets/audios/intro.mp3"},{"revision":"6136d62b03b9a373e45219606edbb877","url":"assets/audios/LevelLoseFanfare.mp3"},{"revision":"7c86597b8546ae3274789bf8bc1ed9a0","url":"assets/audios/LevelWinFanfare.mp3"},{"revision":"227040add97b1daecd5c21c2623e480a","url":"assets/audios/Monster Spits wrong stones-01.mp3"},{"revision":"227040add97b1daecd5c21c2623e480a","url":"assets/audios/MonsterSpit.mp3"},{"revision":"cf0c6919347cc45bc20028d6155aa5d7","url":"assets/audios/onDrag.mp3"},{"revision":"685da4a6886babc85061d0ab8224a0cf","url":"assets/audios/timeout.mp3"},{"revision":"db1df123dd0e87ecf15276c5bbb12681","url":"assets/images/Autumn_bg_v01.jpg"},{"revision":"c1faadf17b183089038d2a6a359a67fc","url":"assets/images/Autumn_fence_v01.png"},{"revision":"86393c975f42233b8548e6dcb844c0c7","url":"assets/images/Autumn_FG_v01.png"},{"revision":"3a0d9f43746bbfeee5381e88de0037e6","url":"assets/images/Autumn_hill_v01.png"},{"revision":"f3187610fd203a4e83f1a6ca42b92701","url":"assets/images/Autumn_sign_v01.png"},{"revision":"350b01e0bccbc96d411eab95d2306802","url":"assets/images/back_btn.png"},{"revision":"d6529000992906e214d4e823e63649cb","url":"assets/images/bar_empty_v01.png"},{"revision":"811d3537ac3d81d68ec6f9484d78540c","url":"assets/images/bar_full_v01.png"},{"revision":"0eb874baac10d2a76c7cc657c756acdf","url":"assets/images/bg_v01.jpg"},{"revision":"11d8d6133c5299e99f95d9761c850ca1","url":"assets/images/close_btn.png"},{"revision":"93324625f6b250c840a4c845d6a4d195","url":"assets/images/cloud_01.png"},{"revision":"0208ccae7af055011d300e720b03a0ed","url":"assets/images/cloud_02.png"},{"revision":"2d17eefbe310cc0c68f15942e8fc2b7c","url":"assets/images/cloud_03.png"},{"revision":"862d49036360e77e5086a4c1e1a5b12b","url":"assets/images/drag11.png"},{"revision":"ce98c9e785191b4b5dec43d9c42a1943","url":"assets/images/drag12.png"},{"revision":"3242e6a9486af3aa13d11fc56aa396a5","url":"assets/images/drag13.png"},{"revision":"6577a2f8480fd3c9e5907aad8078367c","url":"assets/images/drag14.png"},{"revision":"b653a7ca1a76b27b9f648b2595997691","url":"assets/images/eat11.png"},{"revision":"c48c407dcd6d835af787f78676125925","url":"assets/images/eat12.png"},{"revision":"eccaa95cdb97eda5fa1c019f18d616cc","url":"assets/images/eat13.png"},{"revision":"83a2679d95f81b6c55597b68a178c611","url":"assets/images/eat14.png"},{"revision":"34660bc9a2ac6065804aa1a68e80fc3b","url":"assets/images/favicon.png"},{"revision":"48d57fc669287060fa6d0955dfb8d257","url":"assets/images/fence_v01.png"},{"revision":"a267e28cb011391c1df9d59f8f2b5795","url":"assets/images/FG_a_v01.png"},{"revision":"d6ac191de224ec4be62cd9b639b17e9e","url":"assets/images/ftm_bonus_level_monsters.png"},{"revision":"885ce7b3e969576b7b627e657cd9515f","url":"assets/images/great_01.png"},{"revision":"88191ea3184553a3c61342be81a3de4e","url":"assets/images/happy11.png"},{"revision":"a4d0ffff34fa52231965cedff12b7719","url":"assets/images/happy12.png"},{"revision":"110844874baac6a2ba2b814e11f46a2a","url":"assets/images/happy13.png"},{"revision":"f9e96cc182dc3d2b4df737eff3f6b75f","url":"assets/images/happy14.png"},{"revision":"0ab4538bcfd8f9ed476513dedfc4758a","url":"assets/images/hill_v01.png"},{"revision":"63beece149302bc8ce50401afb098811","url":"assets/images/idle11.png"},{"revision":"1347d43e37481de1101b574ed3892fe6","url":"assets/images/idle12.png"},{"revision":"c9885ccbfd7600374a41dea8605b216f","url":"assets/images/idle13.png"},{"revision":"31d4bea6474f82d2939d48e319e27337","url":"assets/images/idle14.png"},{"revision":"d3316f6e45930df8cdb01f0dbe2aa26c","url":"assets/images/idle4.png"},{"revision":"a7468b94a4a45f089c49ce0b894d1a0e","url":"assets/images/levels_v01.png"},{"revision":"38e43cd7b492b624fc3da67dea7b0433","url":"assets/images/loadingImg.gif"},{"revision":"b5fe8b7fc02c5c7dac2a7a27f9779ab2","url":"assets/images/map_btn.png"},{"revision":"426d623c79ec3526eae92a56092b2220","url":"assets/images/map.jpg"},{"revision":"74c001286f2df47d9be71f85799da028","url":"assets/images/mapIcon.png"},{"revision":"c312ed45360c23d5302c7eca60acaf2d","url":"assets/images/mapLock.png"},{"revision":"1c55255523850f041717e1698d6696d8","url":"assets/images/next_btn.png"},{"revision":"8b779c7507a2d179dbddd9bb0979467b","url":"assets/images/output-onlinepngtools.png"},{"revision":"b87dad233d04f0b40641b959b438377e","url":"assets/images/pause_v01.png"},{"revision":"9fa6a44fc1fd8fe7a29685449151fe35","url":"assets/images/pinStar1.png"},{"revision":"fb71b601378213dba8c1093efc8fbc0f","url":"assets/images/pinStar2.png"},{"revision":"02644516a381dce3b2372c5c36222278","url":"assets/images/pinStar3.png"},{"revision":"a8d1a644d1120069ae6cb93ec9a186f0","url":"assets/images/Play_button.png"},{"revision":"785f7eb9898630eb470bbd4cdb9ee6ca","url":"assets/images/popup_bg_v01.png"},{"revision":"07208f75d6caa1e1dddf65d7d3dd5088","url":"assets/images/promptPlayButton.png"},{"revision":"2f08e930ba6b1f3618105080615223c3","url":"assets/images/promptTextBg.png"},{"revision":"2ac07f7f2e98a9354e24544d514a7e0f","url":"assets/images/retry_btn.png"},{"revision":"e7d070072a84c81493d34fbcb9d56a05","url":"assets/images/sad11.png"},{"revision":"562dd11921b6ef4883f72e0965dbd271","url":"assets/images/sad12.png"},{"revision":"43b013bf5367385326d1f0d1729bde50","url":"assets/images/sad13.png"},{"revision":"a6f030e270350c7d3528887091713904","url":"assets/images/sad14.png"},{"revision":"6736c9d8a52dc1a2d9eb69bdf79d3c96","url":"assets/images/score_v01.png"},{"revision":"e6de347fc9cb859f572f713578edb154","url":"assets/images/spit11.png"},{"revision":"8292ce434caaf3eb136a9ffa3102cf27","url":"assets/images/spit12.png"},{"revision":"43b013bf5367385326d1f0d1729bde50","url":"assets/images/spit13.png"},{"revision":"862cfcacb1b4e9736e3b285cecc26705","url":"assets/images/spit14.png"},{"revision":"2f112013306898a438e8734c39b72670","url":"assets/images/spit4.png"},{"revision":"ad3037a2f54a38e25b216512a523f6bc","url":"assets/images/star.png"},{"revision":"80e3f39ff0fdd17298b7871fbf7456a2","url":"assets/images/stone_pink_v02.png"},{"revision":"b6fd372111f6d3e055474ae36d18643f","url":"assets/images/timer_empty.png"},{"revision":"7cbd4851bf2afe5220302744f6a9a8b4","url":"assets/images/timer_full.png"},{"revision":"97edf28b5589c5d07294eb1682e629c5","url":"assets/images/timer.png"},{"revision":"6cd26ba4abc76941e7ac9f2cb0c43647","url":"assets/images/Totem_v02_v01.png"},{"revision":"8b779c7507a2d179dbddd9bb0979467b","url":"assets/images/tutorial_hand.png"},{"revision":"21f291b8591090e275224e58f6fb83c9","url":"assets/images/WIN_screen_bg.png"},{"revision":"5b985d4b659ec6cb355e76a5429ec9f1","url":"assets/images/Winter_bg_01.jpg"},{"revision":"3a54f058e2ec8653a0460b690f6fb3ee","url":"assets/images/Winter_fence_v01.png"},{"revision":"9aecfbcf79160ce6d50860feda240fdf","url":"assets/images/Winter_FG_v01.png"},{"revision":"96347299feee5bf4c241760080d1c3f6","url":"assets/images/Winter_hill_v01.png"},{"revision":"7e73ec28dd8b671392dec3831c80ea7e","url":"assets/images/Winter_sign_v01.png"},{"revision":"d25ae980dc4801d4e1cc7e589350d5c5","url":"feedTheMonster.js"},{"revision":"f0fae86960978c792f5610e1f0cbff06","url":"index.css"},{"revision":"7b4fe00ded7cdba87ad8676ed1714876","url":"index.html"},{"revision":"ae797974ddb3e3332e4e4aa403364538","url":"workers/feedback-text-worker.js"},{"revision":"82b35f45a84db25b80f22e2c9006ad18","url":"manifest.json"}], {
  ignoreURLParametersMatching: [/^cr_/],
  exclude: [/^lang\//],
});
var number = 0;
var version = 1.18;
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
  audioList.push("./lang/" + language + "/ftm_" + language + ".json");
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

async function cacheAudiosFiles(audioList,language){
  let percentageInterval = 10;
  const uniqueAudioURLs = [...new Set(audioList)];
  const partSize = Math.ceil(uniqueAudioURLs.length / percentageInterval);
  

  for(let i=0;i<percentageInterval;i++){
      const startIndex = i * partSize;
      let endIndex = startIndex + partSize;
      if (i == percentageInterval-1) {
        endIndex = uniqueAudioURLs.length;
      }
      const part = uniqueAudioURLs.slice(startIndex, endIndex);
      const cache = await caches.open(workbox.core.cacheNames.precache + language);
      try {
        await cache.addAll(part);
      } catch (e) {
        console.log('Could not add audios:', e);
      } finally {
        await channel.postMessage({
          msg: "Loading",
          data: (i + 1) * percentageInterval,
        });
      }
      // await cache.addAll(part).finally(()=>{
      //   channel.postMessage({
      //     msg: "Loading",
      //     data: (i + 1) * percentageInterval
      //   });
      // }).catch(async (e)=>{
      //   await console.log('Couldnt add audios');
      // });
      
  }

};

function cacheCommonAssets(language) {
  [
    "./lang/" + language + "/audios/fantastic.WAV",
    "./lang/" + language + "/audios/great.wav",
    "./lang/" + language + "/images/fantastic_01.png",
    "./lang/" + language + "/images/great_01.png",
    "./lang/" + language + "/images/title.png",
  ].forEach(async (res) => {
    await cacheLangAssets(res, workbox.core.cacheNames.precache + language);
  });
}



async function cacheFeedBackAudio(feedBackAudios, language) {
  let audioUrls = []
  feedBackAudios.forEach(audio => {
    audioUrls.push(
      self.location.href.includes("https://feedthemonsterdev.curiouscontent.org")
      ? audio.slice(
          0,
          audio.indexOf("/feedthemonster") + "/feedthemonster".length
        ) +
          "dev" +
          audio.slice(
            audio.indexOf("/feedthemonster") + "/feedthemonster".length
          )
      : audio);
  });
  try {
    const cacheName = workbox.core.cacheNames.precache + language;
    const cache = await caches.open(cacheName);
    await Promise.all(audioUrls.map(async (url) => {
      try {
        await cache.add(url);
        console.log('Cached:', url);
      } catch (e) {
        console.log('Error caching feedback Audio:', url, e);
      }
    }));
  } catch (e) {
    console.log('Could not open cache:', e);
  }
}

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

