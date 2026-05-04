const path = require('path');
const { exec } = require('child_process');
const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = (nodeEnv !== 'production');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();
// const ESLintPlugin = require('eslint-webpack-plugin');

// const eslintConfig = require('./.eslintrc.json');

// const CompressionPlugin = require('compression-webpack-plugin');

class WorkboxInjectOnDevBuildPlugin {
  constructor() {
    this.running = false;
    this.pending = false;
  }

  apply(compiler) {
    compiler.hooks.done.tap('WorkboxInjectOnDevBuildPlugin', (stats) => {
      if (stats.hasErrors()) {
        return;
      }
      this.runInject();
    });
  }

  runInject() {
    if (this.running) {
      this.pending = true;
      return;
    }

    this.running = true;
    const injectCommand = process.platform === 'win32'
      ? 'npx.cmd workbox injectManifest'
      : 'npx workbox injectManifest';

    exec(injectCommand, (error, stdout, stderr) => {
      this.running = false;

      if (stdout) {
        process.stdout.write(stdout);
      }
      if (stderr) {
        process.stderr.write(stderr);
      }

      if (error) {
        console.error(`[workbox] injectManifest failed: ${error.message}`);
      }

      if (this.pending) {
        this.pending = false;
        this.runInject();
      }
    });
  }
}

const mode = isDev ? 'development' : 'production';

var config = {
  mode,
  entry: './src/feedTheMonster.ts',
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
    devMiddleware: {
      writeToDisk: true,
    },
    client: {
      overlay: true,
    },
    compress: false,
    port: 8080
  },
  experiments: {
    asyncWebAssembly: true 
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async'
      }
    ],
  },
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'feedTheMonster.js',
    clean: true,
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components/'),
      '@buttons': path.resolve(__dirname, 'src/components/buttons/'),
      '@popups': path.resolve(__dirname, 'src/components/popups/'),
      '@common': path.resolve(__dirname, 'src/common/'),
      '@constants': path.resolve(__dirname, 'src/constants/'),
      '@data': path.resolve(__dirname, 'src/data/'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces/'),
      '@sceneHandler': path.resolve(__dirname, 'src/sceneHandler/'),
      '@scenes': path.resolve(__dirname, 'src/scenes/'),
      '@events': path.resolve(__dirname, 'src/events/'),
      '@feedbackText': path.resolve(__dirname, 'src/components/feedback-text/'),
      '@gamepuzzles': path.resolve(__dirname, 'src/gamepuzzles/'),
      '@gameStateService': path.resolve(__dirname, 'src/gameStateService/'),
      '@gameSettingsService': path.resolve(__dirname, 'src/gameSettingsService/'),
      '@tutorials': path.resolve(__dirname, 'src/tutorials/'),
      '@assessment': path.resolve(__dirname, 'src/assessment/'),
      '@services': path.resolve(__dirname, 'src/services/'),
      '@miniGameStateService': path.resolve(__dirname, 'src/miniGame/miniGameStateService'),
      '@miniGames': path.resolve(__dirname, 'src/miniGame/miniGames'),
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
        { from: "./public/manifest.json", to: "./" },
        { from: "./public/assets", to: "./assets" },
        { from: "./lang", to: "./lang" },
        { from: "./node_modules/@curiouslearning/assessment-survey/public/css", to: "./assessment-survey/css" },
        { from: "./node_modules/@curiouslearning/assessment-survey/public/assets/img", to: "./assessment-survey/img" },
        { from: "./node_modules/@curiouslearning/assessment-survey/public/assets/animation", to: "./assessment-survey/animation" },
        { from: "./node_modules/@curiouslearning/assessment-survey/public/data", to: "./assessment-survey/data" },
        { from: "./node_modules/@curiouslearning/assessment-survey/public/assets/audio", to: "./assessment-survey/audio" },
      ],
    }),
    new webpack.DefinePlugin({
      'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY || ''),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN || ''),
      'process.env.FIREBASE_DATABASE_URL': JSON.stringify(process.env.FIREBASE_DATABASE_URL || ''),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID || ''),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET || ''),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID || ''),
      'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID || ''),
      'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.FIREBASE_MEASUREMENT_ID || ''),
    }),
    // TODO: fix lint issues first
    // lint can be tested by running `npm run lint`
    // new ESLintPlugin({
    //   ...eslintConfig,

    //   // TODO: set this to isDev once we fix all the lint errors.
    //   failOnError: false
    // })
    ...(isDev ? [new WorkboxInjectOnDevBuildPlugin()] : []),
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