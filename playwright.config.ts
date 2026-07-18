import { defineConfig, devices } from "@playwright/test";

// .env.test holds real per-machine test credentials (gitignored) — load it into
// process.env so ADMIN_USER/OWNER_USER/TEST_USER pick up real values.
try {
  process.loadEnvFile(".env.test");
} catch {
  // .env.test not present — helpers fall back to their hardcoded defaults where they have one.
}

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    ? "./tests/e2e/globalSetup"
    : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 2,
  // next dev on-demand-compiles each route on first hit; with 2 parallel workers,
  // the first tests to reach a not-yet-compiled admin route can exceed the 30s
  // default before the page (and its Prisma-backed KPIs) finishes loading.
  timeout: 60000,
  // Vercel cold-start + US→Mumbai DB latency means pages can take 10-15s to
  // render on first hit. 30s gives ample headroom without masking real errors.
  expect: { timeout: 30000 },
  reporter: [["html", { outputFolder: "tests/report" }], ["list"]],
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    // Bypass Vercel Preview Protection in CI.
    // globalSetup hits the staging URL with the bypass header, which causes
    // Vercel to set a session cookie. storageState loads that cookie into
    // every context (both page and request fixtures — Playwright 1.32+ applies
    // storageState to the request fixture as well). Sending the header AND the
    // cookie simultaneously confuses Vercel's protection logic, so we rely
    // solely on the cookie here.
    storageState: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? "./tests/e2e/.auth/bypass.json"
      : undefined,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: "**/mobile.spec.ts",
    },
  ],
});
