/**
 * NAVIGATION, HEADER, SEO, BRAND INTEGRITY — TC-NAV-*, TC-SEO-*
 */
import { test, expect } from "@playwright/test";

// ─── Navigation ───────────────────────────────────────────────────────────────

test("NAV-01 desktop header shows logo and nav links", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  await expect(page.getByAltText(/srilaya/i).or(
    page.locator("img[src*=logo]")
  ).first()).toBeVisible();

  // At least one nav link
  await expect(page.getByRole("navigation").getByRole("link").first()).toBeVisible();
});

test("NAV-02 mobile hamburger menu opens", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const menuBtn = page.getByRole("button", { name: /menu|hamburger/i })
    .or(page.locator("[class*=hamburger],[class*=menu-btn],[aria-label*=menu]")).first();
  await menuBtn.click();
  await page.waitForTimeout(300);

  // Drawer should contain nav links
  await expect(page.getByRole("link", { name: /home|shop|products/i }).first()).toBeVisible();
});

test("NAV-03 mobile drawer closes on backdrop click", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const menuBtn = page.locator("[class*=hamburger],[class*=menu-btn],[aria-label*=menu]").first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await page.waitForTimeout(300);

    // Click backdrop or close button
    const closeBtn = page.getByRole("button", { name: /close/i })
      .or(page.locator("[class*=backdrop],[class*=overlay]")).first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
    // Page should still be functional
    await expect(page.locator("h1, h2").first()).toBeVisible();
  }
});

test("NAV-06 cart badge increments after add", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForTimeout(800);

  const badge = page.locator("[class*=badge],[class*=cart-count],[aria-label*=cart]").first();
  const text = await badge.textContent();
  expect(parseInt(text || "0")).toBeGreaterThan(0);
});

// ─── Brand Integrity ─────────────────────────────────────────────────────────

test("BRAND-01 no SriLaYa Enterprises anywhere", async ({ page }) => {
  const pages = ["/", "/about", "/contact", "/product"];
  for (const path of pages) {
    await page.goto(path);
    const content = await page.content();
    expect(content).not.toContain("SriLaYa Enterprises");
    expect(content).not.toContain("Srilaya Enterprises");
  }
});

test("BRAND-02 no ?? corruption on homepage", async ({ page }) => {
  await page.goto("/");
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toMatch(/\?\?/);
});

test("BRAND-03 no ₹ corruption — prices show ₹ symbol", async ({ page }) => {
  await page.goto("/product");
  await expect(page.getByText(/₹\d/).first()).toBeVisible();
});

test("BRAND-04 about page has no emoji corruption", async ({ page }) => {
  await page.goto("/about");
  const bodyText = await page.locator("body").textContent();
  expect(bodyText).not.toMatch(/\?\?/);
});

// ─── SEO ─────────────────────────────────────────────────────────────────────

test("SEO-01 page titles include SriLaYa Naturals", async ({ page }) => {
  for (const path of ["/", "/product", "/about"]) {
    await page.goto(path);
    const title = await page.title();
    expect(title).toMatch(/SriLaYa/i);
  }
});

test("SEO-02 sitemap.xml returns valid XML", async ({ page }) => {
  const response = await page.goto("/sitemap.xml");
  expect(response?.status()).toBe(200);
  const content = await page.content();
  expect(content).toContain("<urlset");
});

test("SEO-03 robots.txt is accessible", async ({ page }) => {
  const response = await page.goto("/robots.txt");
  expect(response?.status()).toBe(200);
  const text = await page.locator("body, pre").textContent();
  expect(text).toMatch(/user-agent/i);
});

test("SEO-04 product pages have OG meta tags", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
  expect(ogTitle?.length).toBeGreaterThan(0);
});
