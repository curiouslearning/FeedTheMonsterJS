importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);
workbox.precaching.precacheAndRoute([{"revision":"ec214e1eef89105b484900ac15d92649","url":"assets/audios/ButtonClick.mp3"},{"revision":"ec214e1eef89105b484900ac15d92649","url":"assets/audios/ButtonClick.wav"},{"revision":"53a8bfd7392adf8910b433ce13ab4af0","url":"assets/audios/Cheering-02.mp3"},{"revision":"2431a6bb00bfeecfb2d5404bdd087b24","url":"assets/audios/Disapointed-05.mp3"},{"revision":"5ef47da84396ad9a4b83235b87211c04","url":"assets/audios/Eat.mp3"},{"revision":"f27755d5596c69afa238221f75a19afe","url":"assets/audios/fantastic.WAV"},{"revision":"f3349f9e400da37876c81913c0be026e","url":"assets/audios/good job.WAV"},{"revision":"54e68bba98cc48aa41ab13a27f36ae96","url":"assets/audios/great.wav"},{"revision":"21a9071743deb5ef58f5a44ced6ec3ac","url":"assets/audios/intro.mp3"},{"revision":"6136d62b03b9a373e45219606edbb877","url":"assets/audios/LevelLoseFanfare.mp3"},{"revision":"7c86597b8546ae3274789bf8bc1ed9a0","url":"assets/audios/LevelWinFanfare.mp3"},{"revision":"227040add97b1daecd5c21c2623e480a","url":"assets/audios/Monster Spits wrong stones-01.mp3"},{"revision":"227040add97b1daecd5c21c2623e480a","url":"assets/audios/MonsterSpit.mp3"},{"revision":"cf0c6919347cc45bc20028d6155aa5d7","url":"assets/audios/onDrag.mp3"},{"revision":"685da4a6886babc85061d0ab8224a0cf","url":"assets/audios/timeout.mp3"},{"revision":"db1df123dd0e87ecf15276c5bbb12681","url":"assets/images/Autumn_bg_v01.jpg"},{"revision":"c1faadf17b183089038d2a6a359a67fc","url":"assets/images/Autumn_fence_v01.png"},{"revision":"86393c975f42233b8548e6dcb844c0c7","url":"assets/images/Autumn_FG_v01.png"},{"revision":"3a0d9f43746bbfeee5381e88de0037e6","url":"assets/images/Autumn_hill_v01.png"},{"revision":"f3187610fd203a4e83f1a6ca42b92701","url":"assets/images/Autumn_sign_v01.png"},{"revision":"350b01e0bccbc96d411eab95d2306802","url":"assets/images/back_btn.png"},{"revision":"d6529000992906e214d4e823e63649cb","url":"assets/images/bar_empty_v01.png"},{"revision":"811d3537ac3d81d68ec6f9484d78540c","url":"assets/images/bar_full_v01.png"},{"revision":"0eb874baac10d2a76c7cc657c756acdf","url":"assets/images/bg_v01.jpg"},{"revision":"11d8d6133c5299e99f95d9761c850ca1","url":"assets/images/close_btn.png"},{"revision":"93324625f6b250c840a4c845d6a4d195","url":"assets/images/cloud_01.png"},{"revision":"0208ccae7af055011d300e720b03a0ed","url":"assets/images/cloud_02.png"},{"revision":"2d17eefbe310cc0c68f15942e8fc2b7c","url":"assets/images/cloud_03.png"},{"revision":"22ba0b9b10faaba2e8f1f20b71737254","url":"assets/images/drag11.png"},{"revision":"f000335d7c44945a501df639e535e40c","url":"assets/images/drag12.png"},{"revision":"08d79173ca4c21d9d0af4c6c024642b5","url":"assets/images/drag13.png"},{"revision":"d583702277f014c30d2faf1abd8fbf2d","url":"assets/images/drag14.png"},{"revision":"c4ebf4ad991c0797e4453f57989ef657","url":"assets/images/eat11.png"},{"revision":"b1819b79933e3909fd1087d30ac8618e","url":"assets/images/eat12.png"},{"revision":"7d6bfc7ae35a18564b130ef98d3746ce","url":"assets/images/eat13.png"},{"revision":"110f61121723fc9d0d4e8d00ef90bfae","url":"assets/images/eat14.png"},{"revision":"8b9bbb5e631dbd980f95ddc104c2615d","url":"assets/images/eat3.png"},{"revision":"110f61121723fc9d0d4e8d00ef90bfae","url":"assets/images/eat4.png"},{"revision":"c17266e84b2b6880a590d1f3d96b62f5","url":"assets/images/fantastic_01.png"},{"revision":"b03d0eb276c7b1ff5a8bc80aca883185","url":"assets/images/favicon.png"},{"revision":"48d57fc669287060fa6d0955dfb8d257","url":"assets/images/fence_v01.png"},{"revision":"a267e28cb011391c1df9d59f8f2b5795","url":"assets/images/FG_a_v01.png"},{"revision":"d6ac191de224ec4be62cd9b639b17e9e","url":"assets/images/ftm_bonus_level_monsters.png"},{"revision":"885ce7b3e969576b7b627e657cd9515f","url":"assets/images/great_01.png"},{"revision":"d83fda738ebbd6050a8b0999ff98e0ee","url":"assets/images/happy11.png"},{"revision":"4faee5c40dc369f740c797aa3df7ebf9","url":"assets/images/happy12.png"},{"revision":"110844874baac6a2ba2b814e11f46a2a","url":"assets/images/happy13.png"},{"revision":"0c32634282fb7092248ddb9e74f34981","url":"assets/images/happy14.png"},{"revision":"0ab4538bcfd8f9ed476513dedfc4758a","url":"assets/images/hill_v01.png"},{"revision":"fb8de279c507b1ba984e242fd41c1c5a","url":"assets/images/idle11.png"},{"revision":"03eb0fb7f467e118ca8e559b34b2bb23","url":"assets/images/idle12.png"},{"revision":"0a9b3fa911133a1c7a616309a3b02cb0","url":"assets/images/idle13.png"},{"revision":"d3316f6e45930df8cdb01f0dbe2aa26c","url":"assets/images/idle14.png"},{"revision":"d3316f6e45930df8cdb01f0dbe2aa26c","url":"assets/images/idle4.png"},{"revision":"1bc1a2333448c7a1bcf799db23247a22","url":"assets/images/Install_button.png"},{"revision":"a7468b94a4a45f089c49ce0b894d1a0e","url":"assets/images/levels_v01.png"},{"revision":"b5fe8b7fc02c5c7dac2a7a27f9779ab2","url":"assets/images/map_btn.png"},{"revision":"426d623c79ec3526eae92a56092b2220","url":"assets/images/map.jpg"},{"revision":"74c001286f2df47d9be71f85799da028","url":"assets/images/mapIcon.png"},{"revision":"c312ed45360c23d5302c7eca60acaf2d","url":"assets/images/mapLock.png"},{"revision":"1c55255523850f041717e1698d6696d8","url":"assets/images/next_btn.png"},{"revision":"8b779c7507a2d179dbddd9bb0979467b","url":"assets/images/output-onlinepngtools.png"},{"revision":"b87dad233d04f0b40641b959b438377e","url":"assets/images/pause_v01.png"},{"revision":"9fa6a44fc1fd8fe7a29685449151fe35","url":"assets/images/pinStar1.png"},{"revision":"fb71b601378213dba8c1093efc8fbc0f","url":"assets/images/pinStar2.png"},{"revision":"02644516a381dce3b2372c5c36222278","url":"assets/images/pinStar3.png"},{"revision":"a8d1a644d1120069ae6cb93ec9a186f0","url":"assets/images/Play_button.png"},{"revision":"a1c254c3f41f25b56c4f14aa517c880f","url":"assets/images/player.png"},{"revision":"785f7eb9898630eb470bbd4cdb9ee6ca","url":"assets/images/popup_bg_v01.png"},{"revision":"2f08e930ba6b1f3618105080615223c3","url":"assets/images/promptTextBg.png"},{"revision":"2ac07f7f2e98a9354e24544d514a7e0f","url":"assets/images/retry_btn.png"},{"revision":"05784a6e883826d11357b41d4a2cc4c1","url":"assets/images/sad11.png"},{"revision":"296fde795e67bfc52a23374ffb0347cb","url":"assets/images/sad12.png"},{"revision":"e0219fe142454149a838b87b002109da","url":"assets/images/sad13.png"},{"revision":"b5afca33825309273e12bd0018017116","url":"assets/images/sad14.png"},{"revision":"6736c9d8a52dc1a2d9eb69bdf79d3c96","url":"assets/images/score_v01.png"},{"revision":"1e619d83ae2358b4f38f6616ad54df5c","url":"assets/images/sp.jpg"},{"revision":"445db51585912403a96c45981a5b0b54","url":"assets/images/spit11.png"},{"revision":"7c932652cb821f7b0bc07d8eb48ae17a","url":"assets/images/spit12.png"},{"revision":"e0219fe142454149a838b87b002109da","url":"assets/images/spit13.png"},{"revision":"2f112013306898a438e8734c39b72670","url":"assets/images/spit14.png"},{"revision":"2f112013306898a438e8734c39b72670","url":"assets/images/spit4.png"},{"revision":"b0d23f3f5d2a40f86dbcf52bb2f8cf47","url":"assets/images/sprite.png"},{"revision":"be4b8a5365731a97350b17311991eb94","url":"assets/images/spritesheet (2).png"},{"revision":"ad3037a2f54a38e25b216512a523f6bc","url":"assets/images/star.png"},{"revision":"80e3f39ff0fdd17298b7871fbf7456a2","url":"assets/images/stone_pink_v02.png"},{"revision":"b6fd372111f6d3e055474ae36d18643f","url":"assets/images/timer_empty.png"},{"revision":"7cbd4851bf2afe5220302744f6a9a8b4","url":"assets/images/timer_full.png"},{"revision":"97edf28b5589c5d07294eb1682e629c5","url":"assets/images/timer.png"},{"revision":"1b8031354ddc9ae3fe83a60e723b6cbe","url":"assets/images/title.png"},{"revision":"efb93b7899c47d3422a922ef832daaf9","url":"assets/images/Totem_v02_v01.png"},{"revision":"8b779c7507a2d179dbddd9bb0979467b","url":"assets/images/tutorial_hand.png"},{"revision":"f9bdc4998da7d621ecd0894a813ed656","url":"assets/images/WIN_screen_bg.png"},{"revision":"5b985d4b659ec6cb355e76a5429ec9f1","url":"assets/images/Winter_bg_01.jpg"},{"revision":"3a54f058e2ec8653a0460b690f6fb3ee","url":"assets/images/Winter_fence_v01.png"},{"revision":"9aecfbcf79160ce6d50860feda240fdf","url":"assets/images/Winter_FG_v01.png"},{"revision":"96347299feee5bf4c241760080d1c3f6","url":"assets/images/Winter_hill_v01.png"},{"revision":"7e73ec28dd8b671392dec3831c80ea7e","url":"assets/images/Winter_sign_v01.png"},{"revision":"fcd30e48a2f5997ec6b396bebe565060","url":"feedTheMonster.js"},{"revision":"72d0ea49057bccab812e510cf6eb1514","url":"index.css"},{"revision":"abbca8a3cfff5bc1ac056a86398a2cbb","url":"index.html"},{"revision":"96b718deef76cf685d92012bf1006860","url":"lang/arabic/ftm_arabic.json"},{"revision":"ef238d3f51b597e79734f2e61a9e9880","url":"lang/bangla/ftm_bangla.json"},{"revision":"c7a4514679cb388a4bc43bd48a6e2760","url":"lang/brazilianportuguese/ftm_brazilianportuguese.json"},{"revision":"539c35c2b3a3ec8d85e1bf80dafaf7a6","url":"lang/english/ftm_english.json"},{"revision":"f7e527f9639da4f1f90e55a8c38e7932","url":"lang/farsi/ftm_farsi.json"},{"revision":"5f4e55d5300ff8bf36d56a24ad8286ce","url":"lang/french/ftm_french.json"},{"revision":"583bd03453dff2af963c9c0e00dd4fbe","url":"lang/georgian/ftm_georgian.json"},{"revision":"a01e79b7ce72a7044b2946d3df0db9ed","url":"lang/haitiancreole/ftm_haitiancreole.json"},{"revision":"5e7c4777073caf3171de5eb1015e89cc","url":"lang/hindi/ftm_hindi.json"},{"revision":"4054903caaed4744d8ccea41c7fecbb9","url":"lang/igbo/ftm_igbo.json"},{"revision":"90b35e789c0f92a3547207c797727426","url":"lang/javanese/ftm_javanese.json"},{"revision":"63ecafff08a4eaac11deb17f2051b637","url":"lang/javanese/FTMJAVANESE.json"},{"revision":"cbcc0d76d442dca8d3c3dd1f6a072a06","url":"lang/kinyarwanda/ftm_kinyarwanda.json"},{"revision":"b67b81ae514dd0f86a7ab79af1ea9558","url":"lang/kurdish/ftm_kurdish.json"},{"revision":"8e44b531e408ae52618450bbcd86a24a","url":"lang/nepali/ftm_nepali.json"},{"revision":"780910600056a0bdc10f731742dab69b","url":"lang/punjabi/ftm_punjabi.json"},{"revision":"d4a869c5e180c939ffdf08d8d3f1852c","url":"lang/sepedi/ftm_sepedi.json"},{"revision":"9de66125edf73d06944326a67a81740d","url":"lang/siswati/ftm_siswati.json"},{"revision":"8c284d9e9461985a17532b14582bf1de","url":"lang/swahili/ftm_swahili.json"},{"revision":"538f629c5d15ec5521237b58d70b7046","url":"lang/tajik/ftm_tajik.json"},{"revision":"497c47f251b2dfd13077cf60f078908d","url":"lang/turkish/ftm_turkish.json"},{"revision":"83979fa4e4af5d52563e6ca818486f7b","url":"lang/ukranian/ftm_ukranian.json"},{"revision":"0bb9e260366822515ee5240762c4cc7f","url":"lang/vietnamese/ftm_vietnamese.json"},{"revision":"5bc34c9660fa62a3213837587a256644","url":"lang/wolof/ftm_wolof.json"},{"revision":"0cf53891ef41f6bce228c97377d8cf66","url":"manifest.json"},{"revision":"f43583132fe4a6f6e93da463c4e55ba7","url":"workers/feedback-text-worker.js"}], {
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
  await cacheCommonAssets(language);
  let audioList = [];
  fetch("./lang/" + language + "/ftm_" + language + ".json", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) =>
    res.json().then((data) => {
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
