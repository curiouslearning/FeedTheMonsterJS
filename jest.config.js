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
    "@gameStateService/*": ["<rootDir>/src/gameStateService/$1"]
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
  },
};