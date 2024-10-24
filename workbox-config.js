// <<<<<<< HEAD
// const path = require('path');
// =======
// module.exports = {
//   globDirectory: "build/",
//   globPatterns: [
//     "**/*.{wav,mp3,WAV,png,jpg,webp,js,gif,css,html}",
    
//     "./manifest.json"
//   ],
//   maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
//   swDest: "build/sw.js",
//   swSrc: "src/sw-src.js",
//   globIgnores: [
//     "lang/**/*.{wav,mp3,WAV,png,jpg,webp}",
// >>>>>>> pre-develop
const path = require('path');
module.exports = {
  globDirectory: "build/",
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  swDest: path.resolve(__dirname, 'build/sw.js'),
  swSrc: path.resolve(__dirname, 'src/sw-src.js')
};
