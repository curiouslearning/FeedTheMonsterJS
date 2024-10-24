const path = require('path');

module.exports = {
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  swDest: path.resolve(__dirname, 'build/sw.js'),
  swSrc: path.resolve(__dirname, 'sw-src.js')
};
