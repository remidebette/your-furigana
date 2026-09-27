/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
};
