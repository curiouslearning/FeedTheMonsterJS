const path = require('path');
var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

var config = {
  mode: 'production',
  watch: true,
  entry: './feedTheMonster.ts',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
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
    new MiniCssExtractPlugin({
      filename: 'index.css',
    }),
    new CopyPlugin({
      patterns: [
        { from: "./index.html", to: "./" },
        { from: "./index.css", to: "./" },
        { from: "./assets", to: "./assets" },
        { from: "./lang", to: "./lang" },
      ],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};

if (isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config