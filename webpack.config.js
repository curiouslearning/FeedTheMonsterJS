const path = require('path');
const webpack = require('webpack');
const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = (nodeEnv !== 'production');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
// @curiouslearning/sw's CJS entry eagerly loads workbox-core, which touches the
// worker global `self`; define it before requiring the package so the config
// loads under Node.
globalThis.self = globalThis.self || globalThis;
const { createInjectManifestOptions } = require('@curiouslearning/sw');
require('dotenv').config();
// const ESLintPlugin = require('eslint-webpack-plugin');

// const eslintConfig = require('./.eslintrc.json');

// const CompressionPlugin = require('compression-webpack-plugin');

const mode = isDev ? 'development' : 'production';

const productionConfig = require('./config/production.json');
const envConfig = nodeEnv !== 'production' ? require(`./config/${nodeEnv}.json`) : {};
const appConfig = Object.assign({}, productionConfig, envConfig);

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
      // Disabled in CI: the overlay iframe (even with no error to show) sits on top of
      // the page and intercepts Playwright's pointer events, failing every click-based
      // e2e test deterministically.
      overlay: process.env.CI !== 'true',
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
      '@appConfig': path.resolve(__dirname, 'src/app-config'),
    },
    extensions: ['.tsx', '.ts', '.js', '.json', '.css', '.sh', '.babelrc', '.eslintignore', '.gitignore', '.d'],
  },
  plugins: [
    // new CompressionPlugin({
    //   test: /\.(js|css|html|svg|mp3|ttf|jpe?g|png)$/, // File types to compress
    //   threshold: 8192, // Minimum size (in bytes) for a file to be compressed
    //   minRatio: 0.8, // Minimum compression ratio
    // }),
    new webpack.DefinePlugin({
      __APP_CONFIG__: JSON.stringify(appConfig),
    }),
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
    // Compiles src/sw-src.ts (TypeScript, via the inherited ts-loader rule) and
    // injects the precache manifest at self.__WB_MANIFEST, emitting build/sw.js
    // in the same build pass — no separate `workbox injectManifest` CLI step.
    // Language media and per-language assessment audio are excluded from the
    // precache so they remain on-demand caches; both are still emitted as build
    // assets by CopyPlugin. The webpack InjectManifest plugin builds its manifest
    // from compilation assets, so the compilation-asset `exclude` below is what
    // keeps those out.
    //
    // NOTE: createInjectManifestOptions() injects `globDirectory: 'build/'` — a
    // workbox-build/CLI option that the webpack InjectManifest plugin rejects
    // ("'globDirectory' property is not expected to be here"). Strip glob-only
    // keys before handing the options to the plugin.
    new InjectManifest((() => {
      const { globDirectory, globPatterns, globIgnores, ...injectOptions } =
        createInjectManifestOptions({
          swSrc: path.resolve(__dirname, 'src/sw-src.ts'),
          swDest: 'sw.js',
          exclude: [
            /\.map$/,
            /^lang\//,
            /^assessment-survey\/audio\/.*\.mp3$/,
          ],
        });
      return injectOptions;
    })()),
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