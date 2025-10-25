export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  roots: ["<rootDir>"],

  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.ts",
    "repositories/**/*.ts",
    "services/**/*.ts",
    "src/**/*.ts",
    "!**/node_modules/**",
    "!**/generated/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html"],
};
