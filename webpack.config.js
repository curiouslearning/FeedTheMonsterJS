const path = require('path');
const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = (nodeEnv !== 'production');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const ESLintPlugin = require('eslint-webpack-plugin');

// const eslintConfig = require('./.eslintrc.json');

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
      '@gameStateService': path.resolve(__dirname, 'src/gameStateService/'),
      '@gameSettingsService': path.resolve(__dirname, 'src/gameSettingsService/'),
      '@tutorials': path.resolve(__dirname, 'src/tutorials/'),
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
      ],
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