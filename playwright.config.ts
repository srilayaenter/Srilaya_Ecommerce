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
    // globalSetup launches a real Chromium browser, navigates with the bypass
    // header so Vercel grants a proper browser session cookie, then saves the
    // full browser storage state. storageState here loads that cookie into every
    // page context. extraHTTPHeaders covers the request fixture (SMOKE-01/09/10)
    // which creates a fresh APIRequestContext that doesn't inherit storageState.
    storageState: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? "./tests/e2e/.auth/bypass.json"
      : undefined,
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
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
