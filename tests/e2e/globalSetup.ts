import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const STORAGE_STATE_PATH = path.join(__dirname, ".auth", "bypass.json");

// Pages to hit sequentially so each one benefits from the previous warm-up.
const WARM_PATHS = ["/", "/product", "/blog", "/about", "/cart", "/sitemap.xml"];

export default async function globalSetup() {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const baseURL = process.env.TEST_BASE_URL;

  if (!bypassSecret || !baseURL) return;

  // Use a real browser context (not request.newContext) so that Vercel's
  // protection bypass sets a proper browser session cookie. The request fixture
  // creates API-style requests where Vercel may not set the cookie; a browser
  // navigation triggers the full cookie-grant flow.
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
    // Send the bypass header on every navigation to grant the session cookie.
    extraHTTPHeaders: { "x-vercel-protection-bypass": bypassSecret },
  });

  const page = await context.newPage();

  for (const p of WARM_PATHS) {
    try {
      await page.goto(p, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch {
      // Ignore individual errors — purpose is warm-up and cookie grant
    }
  }

  // Save the full browser state (including the Vercel session cookie) so all
  // test contexts (both page and request fixtures) start authenticated.
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await context.storageState({ path: STORAGE_STATE_PATH });

  await browser.close();
}
