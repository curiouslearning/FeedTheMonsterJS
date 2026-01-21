/** @type {import("ts-jest").JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts"
  ],
  coverageReporters: ["lcov", "html"],
  coverageThreshold: {
    // global: {
    //   branches: 80,
    //   functions: 80,
    //   lines: 80,
    //   statements: -20,
    // }
  },
  moduleNameMapper: {
    '@buttons': "<rootDir>/src/components/buttons/",
    "@common/*": "<rootDir>/src/common/index.ts",
    "^@components(.*)$": ["<rootDir>/src/components$1"],
    "@constants/*": "<rootDir>/src/constants/index.ts",
    "@data/*": "<rootDir>/src/data/$1",
    "@events": ["<rootDir>/src/events", "<rootDir>/src/events/$1"],
    "@gameStateService/*": ["<rootDir>/src/gameStateService/$1"],
    "^lodash-es$": "<rootDir>/node_modules/lodash/index.js",
    "^@gamepuzzles(.*)$": "<rootDir>/src/gamepuzzles$1",
    "@gameSettingsService/*":  ["<rootDir>/src/gameSettingsService/$1"],
    "@tutorials/*": ["<rootDir>/src/tutorials/$1"],
    "^@miniGames(.*)$": ["<rootDir>/src/miniGame/miniGames/$1"],
    "^@miniGameStateService(.*)$": ["<rootDir>/src/miniGame/miniGameStateService/$1"],
    "@curiouslearning/analytics": "<rootDir>/node_modules/@curiouslearning/analytics/dist/index.js"
  },
  roots: [
    "<rootDir>/src/"
  ],
  setupFiles: [
    "<rootDir>/setupJest.js"
  ],
  testEnvironment: "jsdom",
  transform: {
    "^.+.ts?$": ["ts-jest",{}],
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/default-mock.js",
    "\\.(css|scss)$": "<rootDir>/__mocks__/default-mock.js"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!lodash-es)"
  ],
};