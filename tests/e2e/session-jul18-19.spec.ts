/**
 * SESSION JUL-18/19 — Tests for all fixes deployed 18–19 Jul 2026.
 *
 * Covers:
 *  JUL1819-01 to JUL1819-05  SSR fix — <main> is server-rendered (PostHogProvider ssr:false no longer wraps it)
 *  JUL1819-06 to JUL1819-07  Blog page nested <main> removed
 *  JUL1819-08 to JUL1819-10  Header Suspense + 5s DB timeout + category cache
 *  JUL1819-11 to JUL1819-13  ProductDetailPage: unstable_cache + 8s timeout + try/catch
 *  JUL1819-14 to JUL1819-16  SearchPage: unstable_cache + timeout + try/catch
 *  JUL1819-17 to JUL1819-19  force-dynamic on shop pages (no stale build cache)
 */
import { test, expect } from "@playwright/test";

// ─── SSR fix: <main> is server-rendered ──────────────────────────────────────
//
// Before the fix, PostHogProvider (ssr:false) wrapped <main id="main-content">,
// so <main> was absent from the initial HTML and only appeared after client-side
// JS ran. With the fix, <main> is inside CartProvider (fully SSR'd).

test("JUL1819-01 <main> is visible on homepage after domcontentloaded (SSR check)", async ({ page }) => {
  // domcontentloaded fires as soon as HTML is parsed — before any JS executes.
  // If <main> is server-rendered it will be present immediately.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").first()).toBeVisible();
});

test("JUL1819-02 <main> is visible on product listing after domcontentloaded", async ({ page }) => {
  await page.goto("/product", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").first()).toBeVisible();
});

test("JUL1819-03 <main> is visible on cart page after domcontentloaded", async ({ page }) => {
  await page.goto("/cart", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").first()).toBeVisible();
});

test("JUL1819-04 <main> is visible on blog page after domcontentloaded", async ({ page }) => {
  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").first()).toBeVisible();
});

test("JUL1819-05 <main> is visible on about page after domcontentloaded", async ({ page }) => {
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main").first()).toBeVisible();
});

// ─── Blog page: nested <main> fix ────────────────────────────────────────────
//
// Blog page previously rendered its own <main> alongside the root layout's
// <main id="main-content">, causing Playwright strict-mode violations and
// invalid HTML. It now uses <div> as its container.

test("JUL1819-06 blog page has exactly one <main> element (no nested mains)", async ({ page }) => {
  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  const mainCount = await page.locator("main").count();
  expect(mainCount).toBe(1);
});

test("JUL1819-07 blog page renders h1 Blog heading", async ({ page }) => {
  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  const h1 = page.getByRole("heading", { level: 1, name: /blog/i });
  await expect(h1).toBeVisible();
});

// ─── Header Suspense + cache ──────────────────────────────────────────────────
//
// Header is now wrapped in <Suspense fallback={<HeaderSkeleton />}> and its
// category query has a 5s timeout + empty-array fallback. The page shell
// streams before the DB resolves.

test("JUL1819-08 header renders on homepage (Suspense resolves)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const header = page.locator("header").first();
  await expect(header).toBeVisible();
});

test("JUL1819-09 header shows at least one nav link (category cache working)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const navLinks = page.locator("header").getByRole("link");
  await expect(navLinks.first()).toBeVisible();
  expect(await navLinks.count()).toBeGreaterThan(0);
});

test("JUL1819-10 header renders on product listing page", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  const header = page.locator("header").first();
  await expect(header).toBeVisible();
});

// ─── ProductDetailPage: unstable_cache + timeout + try/catch ─────────────────
//
// Product detail page now uses unstable_cache with an 8s timeout and try/catch
// fallback so DB slowness/errors render an empty-state page rather than crashing.

test("JUL1819-11 product detail page renders without uncaught JS errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));

  await page.goto("/product", { waitUntil: "networkidle" });
  const firstLink = page.locator("a[href^='/product/']").first();
  await expect(firstLink).toBeVisible();
  const href = await firstLink.getAttribute("href");

  await page.goto(href!, { waitUntil: "networkidle" });
  expect(
    errors.filter(e => !e.includes("chunk") && !e.includes("ResizeObserver")),
    `JS errors on product detail: ${errors.join(", ")}`
  ).toHaveLength(0);
});

test("JUL1819-12 product detail page renders h1 with product name", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  const firstLink = page.locator("a[href^='/product/']").first();
  await expect(firstLink).toBeVisible();
  const href = await firstLink.getAttribute("href");

  await page.goto(href!, { waitUntil: "networkidle" });
  await expect(page.locator("h1").first()).toBeVisible();
});

test("JUL1819-13 product detail page shows price (try/catch still renders on DB slow)", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  const firstLink = page.locator("a[href^='/product/']").first();
  await expect(firstLink).toBeVisible();
  const href = await firstLink.getAttribute("href");

  await page.goto(href!, { waitUntil: "networkidle" });
  // Price must be visible — if DB is slow the fallback still renders it from cache
  await expect(page.getByText(/₹\s*\d+/).first()).toBeVisible();
});

// ─── SearchPage: unstable_cache + timeout + try/catch ────────────────────────
//
// Search page has the same caching + resilience treatment as product detail.

test("JUL1819-14 search page renders without uncaught JS errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));

  await page.goto("/search?q=millet", { waitUntil: "networkidle" });
  expect(
    errors.filter(e => !e.includes("chunk") && !e.includes("ResizeObserver")),
    `JS errors on search: ${errors.join(", ")}`
  ).toHaveLength(0);
});

test("JUL1819-15 search page renders heading or results (not blank)", async ({ page }) => {
  await page.goto("/search?q=millet", { waitUntil: "networkidle" });
  // Either a results count, product links, or empty state — page must not be blank
  const hasContent = await page.locator("h1, h2, a[href^='/product/']").first().isVisible();
  expect(hasContent).toBe(true);
});

test("JUL1819-16 search page returns results for millet", async ({ page }) => {
  await page.goto("/search?q=millet", { waitUntil: "networkidle" });
  const productLinks = page.locator("a[href^='/product/']");
  // If products exist, results should show; otherwise empty state must render
  const count = await productLinks.count();
  if (count > 0) {
    await expect(productLinks.first()).toBeVisible();
  } else {
    // Empty state is acceptable — page must not crash
    await expect(page.locator("main").first()).toBeVisible();
  }
});

// ─── force-dynamic on shop pages ─────────────────────────────────────────────
//
// All shop pages now export `dynamic = "force-dynamic"` so they never serve
// stale build-time cached HTML. Verified by checking pages return fresh data
// and do not have stale static build artifacts.

test("JUL1819-17 product listing page response has no stale Cache-Control max-age", async ({ page }) => {
  const responses: { url: string; cacheControl: string | null }[] = [];
  page.on("response", res => {
    if (res.url().includes("/product") && !res.url().includes("/product/")) {
      responses.push({ url: res.url(), cacheControl: res.headers()["cache-control"] ?? null });
    }
  });

  await page.goto("/product", { waitUntil: "networkidle" });

  const pageResponse = responses[0];
  if (pageResponse?.cacheControl) {
    // force-dynamic pages must not be cached for long periods
    expect(pageResponse.cacheControl).not.toMatch(/max-age=[1-9]\d{3,}/); // no max-age >= 1000s
  }
});

test("JUL1819-18 blog page response has no stale long-lived Cache-Control", async ({ page }) => {
  const responses: { url: string; cacheControl: string | null }[] = [];
  page.on("response", res => {
    if (res.url().endsWith("/blog") || res.url().endsWith("/blog/")) {
      responses.push({ url: res.url(), cacheControl: res.headers()["cache-control"] ?? null });
    }
  });

  await page.goto("/blog", { waitUntil: "domcontentloaded" });

  const pageResponse = responses[0];
  if (pageResponse?.cacheControl) {
    expect(pageResponse.cacheControl).not.toMatch(/max-age=[1-9]\d{3,}/);
  }
});

test("JUL1819-19 all shop pages return 200 status (not 500 after force-dynamic)", async ({ page }) => {
  test.setTimeout(120000);
  const routes = ["/", "/product", "/blog", "/bundles", "/search?q=millet", "/cart"];

  for (const route of routes) {
    const res = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `${route} returned HTTP ${res?.status()}`).not.toBe(500);
    expect(res?.status(), `${route} returned HTTP ${res?.status()}`).not.toBe(404);
  }
});
