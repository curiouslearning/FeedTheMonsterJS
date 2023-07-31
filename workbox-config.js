module.exports = {
  globDirectory: "build/",
  globPatterns: ["**/*.{wav,mp3,WAV,png,jpg,js,json,css,html}", "**/!(*lang*)"],
  swDest: "build/sw.js",
  swSrc: "sw-src.js",
  globIgnores:["lang/**/*"]
};
