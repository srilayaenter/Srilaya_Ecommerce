import { request } from "@playwright/test";
import path from "path";
import fs from "fs";

const STORAGE_STATE_PATH = path.join(__dirname, ".auth", "bypass.json");

// Hit these pages sequentially so each one benefits from the previous warm-up.
// Order matters: "/" warms the category cache first; subsequent pages are fast.
const WARM_PATHS = ["/", "/about", "/blog", "/cart", "/product", "/sitemap.xml", "/robots.txt"];

export default async function globalSetup() {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const baseURL = process.env.TEST_BASE_URL;

  if (!bypassSecret || !baseURL) return;

  const ctx = await request.newContext({ baseURL });
  const headers = { "x-vercel-protection-bypass": bypassSecret };

  // Sequential warm-up: "/" populates unstable_cache for categories,
  // every page after that hits a warm function and warm cache.
  for (const p of WARM_PATHS) {
    try {
      await ctx.get(p, { headers });
    } catch {
      // ignore individual errors — purpose is cache warm-up, not assertion
    }
  }

  // Save the Vercel session cookie so browser contexts skip the auth gate.
  const storageState = await ctx.storageState();
  await ctx.dispose();

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(storageState));
}
