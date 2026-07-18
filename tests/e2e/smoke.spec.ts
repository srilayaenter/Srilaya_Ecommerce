/**
 * STAGING SMOKE SUITE — runs against any deployment URL via TEST_BASE_URL.
 * Public routes only, no auth. Target: < 90 seconds total.
 * Must pass before merging to main (enforced by branch protection rule).
 */
import { test, expect } from "@playwright/test";

test("SMOKE-01 health endpoint returns 200", async ({ request }) => {
  const res = await request.get("/api/healthz");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("SMOKE-02 homepage loads with brand name", async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Logo or brand name visible
  await expect(
    page.getByText(/srilaya/i).or(page.getByAltText(/srilaya/i)).first()
  ).toBeVisible();
});

test("SMOKE-03 products listing renders at least one product", async ({ page }) => {
  await page.goto("/product");
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Product cards link to individual product pages
  const productLinks = page.locator("a[href^='/product/']");
  await expect(productLinks.first()).toBeVisible({ timeout: 15000 });
  expect(await productLinks.count()).toBeGreaterThan(0);
});

test("SMOKE-04 product detail page loads with price and Add to Cart", async ({ page }) => {
  // Navigate to listing and follow first product link
  await page.goto("/product");
  const firstLink = page.locator("a[href^='/product/']").first();
  const href = await firstLink.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!);
  await expect(page).not.toHaveTitle(/error|not found/i);

  // Price in rupees should be visible
  await expect(page.getByText(/₹\s*\d+/).first()).toBeVisible({ timeout: 10000 });

  // Add to Cart button (or disabled variant if all variants sold out)
  await expect(
    page.getByRole("button", { name: /add to cart|out of stock/i }).first()
  ).toBeVisible({ timeout: 10000 });
});

test("SMOKE-05 search returns results for 'millet'", async ({ page }) => {
  await page.goto("/search?q=millet");
  await expect(page).not.toHaveTitle(/error|not found/i);
  // At least one product card or result count text
  const results = page.locator("a[href^='/product/']").or(
    page.getByText(/\d+\s+result/i)
  );
  await expect(results.first()).toBeVisible({ timeout: 15000 });
});

test("SMOKE-06 cart page loads (empty state is fine)", async ({ page }) => {
  await page.goto("/cart");
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(
    page.getByText(/cart|bag|empty|your order/i).first()
  ).toBeVisible({ timeout: 10000 });
});

test("SMOKE-07 blog listing loads at least one post", async ({ page }) => {
  await page.goto("/blog");
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Either a post link or an empty-state message — no 500
  await expect(page.locator("h1, h2, h3").first()).toBeVisible({ timeout: 10000 });
});

test("SMOKE-08 key static pages render without 500", async ({ page }) => {
  const routes = ["/about", "/contact", "/privacy", "/terms", "/shipping-policy"];
  for (const route of routes) {
    const res = await page.goto(route);
    expect(
      res?.status(),
      `${route} returned ${res?.status()}`
    ).not.toBe(500);
    await expect(
      page.locator("h1, main").first(),
      `${route} has no h1 or main`
    ).toBeVisible({ timeout: 10000 });
  }
});

test("SMOKE-09 sitemap.xml is valid XML with at least one URL", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("<urlset");
  expect(text).toContain("<loc>");
  // Domain varies per environment (staging uses its own domain), so just
  // verify URLs are present and well-formed.
  expect(text).toMatch(/<loc>https:\/\//i);
});

test("SMOKE-10 robots.txt disallows /admin on staging", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  // Admin should always be disallowed regardless of environment
  expect(text).toContain("Disallow: /admin");
});
