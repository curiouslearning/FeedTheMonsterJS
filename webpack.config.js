const path = require('path');
const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = (nodeEnv !== 'production');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container: { ModuleFederationPlugin } } = require('webpack');
const { InjectManifest } = require('workbox-webpack-plugin');
// const ESLintPlugin = require('eslint-webpack-plugin');

// const eslintConfig = require('./.eslintrc.json');

// const CompressionPlugin = require('compression-webpack-plugin');

const mode = isDev ? 'development' : 'production';
const assessmentRemoteUrlFallback = './assessment-survey-js/remoteEntry.js';
const assessmentRemoteUrlFromEnv = process.env.ASSESSMENT_REMOTE_URL || '';
const assessmentRemote = `promise new Promise((resolve, reject) => {
  const remoteGlobal = 'assessment_survey_js';
  const configuredUrl = window.__ASSESSMENT_REMOTE_URL__ || '${assessmentRemoteUrlFromEnv}';
  const remoteUrl = configuredUrl || new URL('${assessmentRemoteUrlFallback}', window.location.href).toString();

  if (window[remoteGlobal]) {
    return resolve(window[remoteGlobal]);
  }

  const existingScript = document.querySelector('script[data-assessment-remote="true"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window[remoteGlobal]));
    existingScript.addEventListener('error', () => reject(new Error('Failed to load ' + remoteUrl)));
    return;
  }

  const script = document.createElement('script');
  script.src = remoteUrl;
  script.type = 'text/javascript';
  script.async = true;
  script.dataset.assessmentRemote = 'true';
  script.onload = () => resolve(window[remoteGlobal]);
  script.onerror = () => reject(new Error('Failed to load ' + remoteUrl));
  document.head.appendChild(script);
})`;

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
    port: 8081
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
    publicPath: "auto",
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
      '@services': path.resolve(__dirname, 'src/services/'),
      '@miniGameStateService': path.resolve(__dirname, 'src/miniGame/miniGameStateService'),
      '@miniGames': path.resolve(__dirname, 'src/miniGame/miniGames'),
    },
    extensions: ['.tsx', '.ts', '.js', '.json', '.css', '.sh', '.babelrc', '.eslintignore', '.gitignore', '.d'],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "feedthemonsterjs",
      remotes: {
        "assessment_survey_js": assessmentRemote,
      },
      shared: {},
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    // new CompressionPlugin({
    //   test: /\.(js|css|html|svg|mp3|ttf|jpe?g|png)$/, // File types to compress
    //   threshold: 8192, // Minimum size (in bytes) for a file to be compressed
    //   minRatio: 0.8, // Minimum compression ratio
    // }),
    new CopyPlugin({
      patterns: [
        { from: "./public/index.css", to: "./" },
        { from: "./public/assets", to: "./assets" },
        { from: "./public/manifest.json", to: "./" },
        { from: "./lang", to: "./lang" },
        {
          from: "../assessment-survey-js/dist",
          to: "./assessment-survey-js",
          noErrorOnMissing: true,
        },
      ],
    }),
    new InjectManifest({
      swSrc: "./src/sw-src.js",
      swDest: "sw.js",
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
    }),

    // TODO: fix lint issues first
    // lint can be tested by running `npm run lint`
    // new ESLintPlugin({
    //   ...eslintConfig,

    //   // TODO: set this to isDev once we fix all the lint errors.
    //   failOnError: false
    // })
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
