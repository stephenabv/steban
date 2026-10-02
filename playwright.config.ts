import { defineConfig, devices } from "@playwright/test";
import { E2E_ENV, E2E_PORT, STORAGE_STATE } from "./tests/e2e/support/e2eEnv";

/**
 * End-to-end tests run against a production build (`next build && next start`):
 * the dev server's CSP differs from production. Storage is the local JSON
 * store under data/, never a real database.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.(spec|setup)\.ts$/,
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/e2e/support/globalSetup.ts",
  globalTeardown: "./tests/e2e/support/globalTeardown.ts",
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      name: "admin",
      testMatch: /coverLetters\.spec\.ts$/,
      dependencies: ["setup"],
      use: { storageState: STORAGE_STATE },
    },
    { name: "anonymous", testMatch: /unauthenticated\.spec\.ts$/ },
  ],
  webServer: {
    command: `npx next build && npx next start --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    env: E2E_ENV,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
