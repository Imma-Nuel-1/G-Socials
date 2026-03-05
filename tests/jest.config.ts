import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  // Strip .js extensions from imports (server source uses .js for ESM compat)
  moduleNameMapper: {
    "^(\\.\\.?\\/.*)\\.js$": "$1",
  },
  // ts-jest config — use the tests tsconfig
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  // Load server .env before tests
  setupFiles: ["<rootDir>/setup.ts"],
  // Longer timeout for DB integration tests
  testTimeout: 30_000,
  // Run test files sequentially (they share a real DB)
  maxWorkers: 1,
  verbose: true,
};

export default config;
