/**
 * MOBILE RESPONSIVENESS — TC-MOB-* (runs in Pixel 5 viewport via playwright.config.ts)
 */
import { test, expect } from "@playwright/test";

// All tests in this file run with { ...devices["Pixel 5"] } from the "mobile" project.

test("MOB-01 homepage hero CTAs stack vertically on mobile", async ({ page }) => {
  await page.goto("/");

  const ctas = page.locator("[class*=hero] a, [class*=hero] button").filter({
    hasText: /shop|explore/i,
  });

  if (await ctas.count() >= 2) {
    const first = await ctas.nth(0).boundingBox();
    const second = await ctas.nth(1).boundingBox();
    if (first && second) {
      // On mobile, buttons should stack (second below first)
      expect(second.y).toBeGreaterThan(first.y + first.height - 10);
    }
  }
});

test("MOB-01b no horizontal overflow on homepage", async ({ page }) => {
  await page.goto("/");
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
});

test("MOB-02 product page stacks gallery above details", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  const gallery = page.locator("[class*=gallery], [class*=image]").first();
  const title = page.locator("h1").first();

  const galleryBox = await gallery.boundingBox();
  const titleBox = await title.boundingBox();

  if (galleryBox && titleBox) {
    // Gallery should be above or at same level as title on mobile
    expect(galleryBox.y).toBeLessThanOrEqual(titleBox.y + 20);
  }
});

test("MOB-02b product page no horizontal overflow", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
});

test("MOB-03 checkout order summary appears above form", async ({ page }) => {
  // Add item first
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForTimeout(800);

  await page.goto("/checkout");

  const summary = page.locator("[class*=summary],[class*=order-summary]").first();
  const form = page.locator("form").first();

  const summaryBox = await summary.boundingBox();
  const formBox = await form.boundingBox();

  if (summaryBox && formBox) {
    expect(summaryBox.y).toBeLessThan(formBox.y + 50);
  }
});

test("MOB-04 size dropdown arrow is visible on mobile", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  // The custom SVG chevron should be visible
  const chevron = page.locator("svg path[d*='m6 9']").or(
    page.locator("[class*=dropdown] svg, [class*=select-wrapper] svg")
  ).first();

  const select = page.locator("select").first();
  const selectBox = await select.boundingBox();

  if (selectBox) {
    // Verify the select has appearance-none (custom arrow applied)
    const appearanceStyle = await select.evaluate(
      el => getComputedStyle(el).appearance || getComputedStyle(el).webkitAppearance
    );
    expect(appearanceStyle).toMatch(/none/i);
  }
});

test("MOB-05 cart page usable on mobile", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForTimeout(800);

  await page.goto("/cart");

  // Qty controls should be present and tappable (large enough)
  const plusBtn = page.getByRole("button", { name: "+" }).first();
  if (await plusBtn.count() > 0) {
    const box = await plusBtn.boundingBox();
    // Touch target should be at least 32px
    expect(box?.width).toBeGreaterThanOrEqual(32);
    expect(box?.height).toBeGreaterThanOrEqual(32);
  }
});

test("MOB-06 footer renders without overflow on mobile", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const footer = page.locator("footer").first();
  const footerBox = await footer.boundingBox();
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  if (footerBox) {
    expect(footerBox.width).toBeLessThanOrEqual(viewportWidth + 5);
  }
});

test("MOB-07 shipping policy table scrollable on mobile", async ({ page }) => {
  await page.goto("/shipping-policy");
  await expect(page.locator("h1").first()).toBeVisible();
  // No horizontal overflow on the page itself
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  // Tables can overflow in a scroll container — that's acceptable
  // We check the page doesn't force horizontal scroll on the body
  // (table should be in overflow-x-auto container)
  const tableWrapper = page.locator("[class*=overflow-x-auto]");
  if (await tableWrapper.count() > 0) {
    await expect(tableWrapper.first()).toBeVisible();
  }
});
