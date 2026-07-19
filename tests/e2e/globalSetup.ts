import { request } from "@playwright/test";

// Warm up key Vercel serverless function instances before tests run.
// Each navigation populates Next.js unstable_cache so the header's category
// query doesn't cold-start during the actual test assertions.
// The bypass header is sent here so Vercel allows the warm-up requests;
// the real per-test bypass is handled via page.route() in smoke.spec.ts.
const WARM_PATHS = ["/", "/product", "/blog", "/about", "/cart", "/search?q=millet", "/sitemap.xml"];

export default async function globalSetup() {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const baseURL = process.env.TEST_BASE_URL;

  if (!bypassSecret || !baseURL) return;

  const ctx = await request.newContext({ baseURL });
  const headers = { "x-vercel-protection-bypass": bypassSecret };

  // Sequential so "/" warms the category cache before other pages hit it.
  for (const p of WARM_PATHS) {
    try {
      await ctx.get(p, { headers });
    } catch {
      // ignore — warm-up errors don't block tests
    }
  }

  await ctx.dispose();
}
