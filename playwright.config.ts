import { defineConfig, devices } from "@playwright/test";

const PORT = 3127;

// Browser tests run against the production build (run `npm run build` first, or use `npm run test:e2e`).
// They use the Chrome already installed on the machine, so no browser download is needed.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
    ...devices["Pixel 5"],
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
