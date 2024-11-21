module.exports = {
  globDirectory: "build/",
  globPatterns: [
    "**/*.{wav,mp3,WAV,png,jpg,webp,js,gif,css,html,json,riv,wasm}", // for offline files in order to save
    "./manifest.json"
  ],
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB limit
  swDest: "build/sw.js",
  swSrc: "src/sw-src.js",
  globIgnores: [
    "lang/**/*.{wav,mp3,WAV,png,jpg,webp,riv,wasm,js}", // Exclude specific paths if needed
  ],
};
