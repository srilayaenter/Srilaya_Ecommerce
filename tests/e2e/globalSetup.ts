import { request } from "@playwright/test";
import path from "path";
import fs from "fs";

const STORAGE_STATE_PATH = path.join(__dirname, ".auth", "bypass.json");

// Pages to pre-warm so unstable_cache is hot before tests run.
// Each request also exercises the Vercel serverless function cold start.
const WARM_PATHS = ["/", "/about", "/blog", "/cart", "/product", "/sitemap.xml", "/robots.txt"];

export default async function globalSetup() {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const baseURL = process.env.TEST_BASE_URL;

  if (!bypassSecret || !baseURL) return;

  const ctx = await request.newContext({ baseURL });
  const headers = { "x-vercel-protection-bypass": bypassSecret };

  // Hit all key pages in parallel to warm Vercel function + Next.js unstable_cache.
  // Ignore errors — we just want the cache warmed, not to assert anything yet.
  await Promise.allSettled(
    WARM_PATHS.map(p => ctx.get(p, { headers }))
  );

  // Save the session cookie Vercel set so browser contexts don't hit the auth gate.
  const storageState = await ctx.storageState();
  await ctx.dispose();

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(storageState));
}
