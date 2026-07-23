/**
 * STAGING SMOKE SUITE — runs against any deployment URL via TEST_BASE_URL.
 * Public routes only, no auth. Target: < 90 seconds total.
 * Must pass before merging to main (enforced by branch protection rule).
 */
import { test, expect } from "@playwright/test";

// Inject the Vercel bypass header on every browser request (navigation included).
// extraHTTPHeaders in playwright.config.ts works for the request fixture (raw
// HTTP) but not for Chromium browser navigations via CDP. page.route() intercepts
// at Playwright's network layer and reliably adds headers to navigation requests.
test.beforeEach(async ({ page }) => {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypassSecret) {
    await page.route("**/*", (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-vercel-protection-bypass": bypassSecret,
        },
      })
    );
  }
});

test("SMOKE-01 health endpoint returns 200", async ({ request }) => {
  const res = await request.get("/api/healthz");
  const body = await res.json().catch(() => ({}));
  expect(res.status(), `healthz body: ${JSON.stringify(body)}`).toBe(200);
  expect(body.status).toBe("ok");
});

test("SMOKE-02 homepage loads with brand name", async ({ page }) => {
  // domcontentloaded: title is in <head> (first streaming chunk); no need to
  // wait for body streaming or network-idle.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/srilaya/i);
  await expect(page).not.toHaveTitle(/error|not found/i);
});

test("SMOKE-03 products listing renders at least one product", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  const productLinks = page.locator("a[href^='/product/']");
  // No explicit timeout — global 30s accommodates cold-start DB latency
  await expect(productLinks.first()).toBeVisible();
  expect(await productLinks.count()).toBeGreaterThan(0);
});

test("SMOKE-04 product detail page loads with price and Add to Cart", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  const firstLink = page.locator("a[href^='/product/']").first();
  await expect(firstLink).toBeVisible();
  const href = await firstLink.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!, { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText(/₹\s*\d+/).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /add to cart|out of stock/i }).first()
  ).toBeVisible();
});

test("SMOKE-05 search returns results for 'millet'", async ({ page }) => {
  await page.goto("/search?q=millet", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  const results = page.locator("a[href^='/product/']").or(
    page.getByText(/\d+\s+result/i)
  );
  await expect(results.first()).toBeVisible();
});

test("SMOKE-06 cart page loads (empty state is fine)", async ({ page }) => {
  await page.goto("/cart", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // <main> is in the layout shell — appears before any DB query resolves
  await expect(page.locator("main")).toBeVisible();
  await expect(
    page.getByText(/cart|bag|empty|your order/i).first()
  ).toBeVisible();
});

test("SMOKE-07 blog listing loads at least one post", async ({ page }) => {
  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("h1, h2, h3").first()).toBeVisible();
});

test("SMOKE-08 key static pages render without 500", async ({ page }) => {
  const routes = ["/about", "/contact", "/privacy", "/terms", "/shipping-policy"];
  for (const route of routes) {
    const res = await page.goto(route, { waitUntil: "networkidle" });
    expect(
      res?.status(),
      `${route} returned ${res?.status()}`
    ).not.toBe(500);
    // <main> is in the layout shell — fast check that page loaded without crashing
    await expect(
      page.locator("main").first(),
      `${route} has no main element`
    ).toBeVisible();
  }
});

test("SMOKE-09 sitemap.xml is valid XML with at least one URL", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("<urlset");
  expect(text).toContain("<loc>");
  expect(text).toMatch(/<loc>https:\/\//i);
});

test("SMOKE-10 robots.txt disallows /admin on staging", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("Disallow: /admin");
});

test("SMOKE-11 wishlist page loads without error (guest empty state)", async ({ page }) => {
  await page.goto("/wishlist", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Must not show the error boundary
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  // Page header must be visible
  await expect(page.getByRole("heading", { name: /wishlist/i })).toBeVisible();
});

test("SMOKE-12 product detail page shows wishlist heart button", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  const firstLink = page.locator("a[href^='/product/']").first();
  const href = await firstLink.getAttribute("href");
  await page.goto(href!, { waitUntil: "networkidle" });
  // WishlistButton is client-only (ssr:false) — wait for hydration
  await expect(
    page.getByRole("button", { name: /wishlist/i }).first()
  ).toBeVisible({ timeout: 10000 });
});
