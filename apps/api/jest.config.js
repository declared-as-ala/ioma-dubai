/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  // nanoid v5 ships ESM-only — Jest's default transformIgnorePatterns
  // skips all of node_modules, so any spec that pulls in a service
  // importing nanoid (orders, payments) fails with "Cannot use import
  // statement outside a module" unless nanoid is carved out here. pnpm's
  // nested node_modules/.pnpm/nanoid@.../node_modules/nanoid layout means
  // the naive `node_modules/(?!(nanoid)/)` pattern never matches (the
  // FIRST node_modules segment is followed by `.pnpm/`, not `nanoid/`) —
  // this pattern instead just checks "nanoid" appears anywhere after.
  transformIgnorePatterns: ["node_modules/(?!.*nanoid)"],
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@ioma/types$": "<rootDir>/../../../packages/types/src/index.ts",
    "^@ioma/config$": "<rootDir>/../../../packages/config/src/index.ts",
  },
};
