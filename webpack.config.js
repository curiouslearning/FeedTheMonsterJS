const path = require('path');
const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = (nodeEnv !== 'production');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const CompressionPlugin = require('compression-webpack-plugin');

const mode = isDev ? 'development' : 'production';

var config = {
  mode,
  entry: './src/feedTheMonster.ts',
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
    client: {
      overlay: true,
    },
    compress: false,
    port: 8080
  },
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
      }
    ],
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'feedTheMonster.js',
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components/'),
      '@buttons': path.resolve(__dirname, 'src/components/buttons/'),
      '@popups': path.resolve(__dirname, 'src/components/popups/'),
      '@common': path.resolve(__dirname, 'src/common/'),
      '@compositions': path.resolve(__dirname, 'src/compositions/'), // to be removed once background component has been fully integrated
      '@constants': path.resolve(__dirname, 'src/constants/'),
      '@data': path.resolve(__dirname, 'src/data/'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces/'),
      '@sceneHandler': path.resolve(__dirname, 'src/sceneHandler/'),
      '@scenes': path.resolve(__dirname, 'src/scenes/'),
      '@events': path.resolve(__dirname, 'src/events/'),
      '@feedbackText': path.resolve(__dirname, 'src/components/feedback-text/'),
      '@gamepuzzles': path.resolve(__dirname, 'src/gamepuzzles/'),
      '@gameStateService': path.resolve(__dirname, 'src/gameStateService/')
    },
    extensions: ['.tsx', '.ts', '.js', '.json', '.css', '.sh', '.babelrc', '.eslintignore', '.gitignore', '.d'],
  },
  plugins: [
    // new CompressionPlugin({
    //   test: /\.(js|css|html|svg|mp3|ttf|jpe?g|png)$/, // File types to compress
    //   threshold: 8192, // Minimum size (in bytes) for a file to be compressed
    //   minRatio: 0.8, // Minimum compression ratio
    // }),
    new CopyPlugin({
      patterns: [
        { from: "./public/index.html", to: "./" },
        { from: "./public/index.css", to: "./" },
        { from: "./public/assets", to: "./assets" },
        { from: "./lang", to: "./lang" },
      ],
    })
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