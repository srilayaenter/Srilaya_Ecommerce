import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const STORAGE_STATE_PATH = path.join(__dirname, ".auth", "bypass.json");

// Pages to warm sequentially after the bypass cookie is established.
const WARM_PATHS = ["/", "/product", "/blog", "/about", "/cart"];

export default async function globalSetup() {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const baseURL = process.env.TEST_BASE_URL;

  if (!bypassSecret || !baseURL) return;

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  // Vercel's browser-side bypass flow requires the secret in the QUERY
  // PARAMETER (not the header). Vercel validates it, sets a `_vercel_jwt`
  // session cookie, then redirects to the clean URL. The header-only approach
  // works for API (request fixture) requests but Vercel ignores it for
  // browser navigation requests.
  const bypassURL = `/?x-vercel-protection-bypass=${bypassSecret}`;
  await page.goto(bypassURL, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait for Vercel to redirect to the clean URL after setting the cookie.
  // waitForURL with a broad pattern just waits for navigation to settle.
  try {
    await page.waitForURL(url => !url.searchParams.has("x-vercel-protection-bypass"), {
      timeout: 15000,
    });
  } catch {
    // If redirect doesn't happen within 15s, proceed — cookie may still be set
  }

  // Warm key pages so Next.js unstable_cache is populated before tests run.
  for (const p of WARM_PATHS) {
    try {
      await page.goto(p, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch {
      // Ignore — purpose is cache warm-up, not assertion
    }
  }

  // Save the browser session state. The _vercel_jwt cookie is now included,
  // so every test's page context (and Playwright 1.32+ request fixture) will
  // send it automatically and bypass Vercel's preview protection.
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await context.storageState({ path: STORAGE_STATE_PATH });

  await browser.close();
}
