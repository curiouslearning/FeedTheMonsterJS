/** @type {import("ts-jest").JestConfigWithTsJest} **/
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts"
  ],
  coverageReporters: ["lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -20,
    }
  },
  moduleNameMapper: {
    "@common/*": "<rootDir>/src/common/index.ts",
    "^@components(.*)$": ["<rootDir>/src/components$1"],
    "@constants/*": "<rootDir>/src/constants/index.ts",
    "@data/*": "<rootDir>/src/data/$1",
    "@events": ["<rootDir>/src/events", "<rootDir>/src/events/$1"],
    "@gameStateService/*": ["<rootDir>/src/gameStateService/$1"],
    "^@gamepuzzles$": "<rootDir>/src/gamepuzzles/index.ts"
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