/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts"
  ],
  coverageReporters: ["json", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -20,
    }
  },
  moduleNameMapper: {
    '@constants/*': '<rootDir>/src/constants/index.ts'
  },
  testEnvironment: "jsdom",
  transform: {
    "^.+.ts?$": ["ts-jest",{}],
  },
};