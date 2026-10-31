import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/** End-to-end tests run against a production build (`npm run build` first) in offline mode. */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    // The test runner shares one IP, so the per-client limits are raised for e2e only.
    env: { GEMINI_API_KEY: "", PLAN_RATE_LIMIT: "1000", CHAT_RATE_LIMIT: "1000" },
  },
});
