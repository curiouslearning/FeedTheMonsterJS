const path = require('path');

module.exports = {
  globDirectory: "build/",
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  swDest: path.resolve(__dirname, 'build/sw.js'),
  swSrc: path.resolve(__dirname, 'src/sw-src.js')
};
