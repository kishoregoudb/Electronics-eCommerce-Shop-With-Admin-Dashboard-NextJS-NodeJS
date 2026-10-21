// HTTP tests for the Express app. Kept separate from next/jest so server
// CommonJS files are not compiled as Next.js pages.
module.exports = {
  displayName: "server",
  rootDir: "./server",
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  // Importing the app constructs several Prisma clients, which keep the
  // process alive after the assertions finish.
  forceExit: true,
};
