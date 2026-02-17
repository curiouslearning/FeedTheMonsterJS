module.exports = {
  globDirectory: "build/",
  globPatterns: [
    "**/*.{wav,mp3,WAV,png,jpg,webp,svg,js,gif,css,html,json,riv,wasm}", // for offline files in order to save
    "**/manifest.json",
    "assessment-webcomponent.js" // Assessment web component bundle
  ],
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB limit
  swDest: "build/sw.js",
  swSrc: "src/sw-src.js",
  globIgnores: [
    "lang/**/*.{wav,mp3,WAV,png,jpg,webp,svg,riv,wasm,js}", // Exclude specific paths if needed
    "assessment-audio/**/*", // Exclude assessment audio from precache (too large, will use runtime caching)
  ],
};
