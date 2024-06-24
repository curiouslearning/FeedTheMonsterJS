const path = require('path');
var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');
const CopyPlugin = require("copy-webpack-plugin");

var config = {
  mode: 'development',
  watch: true,
  entry: './feedTheMonster.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'feedTheMonster.js',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json', '.css', '.sh', '.babelrc', '.eslintignore', '.gitignore', '.d'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./index.html", to: "./" },
        { from: "./index.css", to: "./" },
        { from: "./assets", to: "./assets" },
        { from: "./lang", to: "./lang" },
      ],
    }),
  ]
};

if (isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config