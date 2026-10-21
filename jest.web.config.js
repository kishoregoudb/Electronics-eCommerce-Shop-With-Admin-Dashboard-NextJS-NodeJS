const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

// Web tests only. server/tests holds ad hoc scripts and must stay out of this run.
module.exports = createJestConfig({
  displayName: "web",
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["<rootDir>/__tests__/web/**/*.test.ts"],
});
