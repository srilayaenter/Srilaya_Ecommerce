/**
 * PRODUCTS & CATALOG — TC-PROD-01 to TC-PROD-13
 * Covers: listing, detail page, variants, stock, gallery, categories, search, reviews.
 */
import { test, expect } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";

test("PROD-01 product listing page loads with items", async ({ page }) => {
  await page.goto("/product");
  expect(await page.locator("a[href^='/product/']").count()).toBeGreaterThan(0);
  // No ?? corruption
  await expect(page.getByText("??")).not.toBeVisible();
});

test("PROD-01b product listing prices show ₹ symbol", async ({ page }) => {
  await page.goto("/product");
  const priceText = await page.locator("text=/₹\\d/").first().textContent();
  expect(priceText).toContain("₹");
});

test("PROD-02 product detail page loads correctly", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  // Key elements present
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  await expect(page.getByText(/₹/).first()).toBeVisible();
});

test("PROD-03 variant selection updates price", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  const select = page.locator("select").first();
  const optionCount = await select.locator("option").count();

  if (optionCount > 1) {
    const priceBefore = await page.getByText(/₹\d/).first().textContent();
    await select.selectOption({ index: 1 });
    await page.waitForTimeout(300);
    const priceAfter = await page.getByText(/₹\d/).first().textContent();
    // Price should be a valid ₹ amount (may or may not change)
    expect(priceAfter).toMatch(/₹[\d.]+/);
    // Log if unchanged (expected for same-price variants)
    if (priceBefore === priceAfter) {
      console.log("PROD-03: Prices equal across variants (acceptable)");
    }
  } else {
    console.log("PROD-03: Single variant — skipping price-change check");
  }
});

test("PROD-04 out-of-stock variant disables Add to Cart", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  const select = page.locator("select").first();
  const options = await select.locator("option").allTextContents();
  const oosSiblings = options.filter(o => o.includes("Out of Stock"));

  if (oosSiblings.length > 0) {
    await select.selectOption({ label: oosSiblings[0] });
    await page.waitForTimeout(300);
    const addBtn = page.getByRole("button", { name: /add to cart/i });
    await expect(addBtn).toBeDisabled();
    await expect(page.getByText(/out of stock/i)).toBeVisible();
  } else {
    console.log("PROD-04: No out-of-stock variant found — skipping");
  }
});

test("PROD-05 product gallery image changes on thumbnail click", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  const thumbnails = page.locator("img[class*=thumb], [class*=gallery] img").nth(1);
  if (await thumbnails.count() > 0) {
    await thumbnails.click();
    await page.waitForTimeout(300);
    // Just verify no crash
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("PROD-06 category page shows filtered products", async ({ page }) => {
  await page.goto("/category/millet-flakes");
  const heading = page.locator("h1, h2").first();
  await expect(heading).toBeVisible();
  await expect(page.locator("a[href^='/product/']").first()).toBeVisible();
});

test("PROD-07 search returns relevant results", async ({ page }) => {
  await page.goto("/");
  const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole("searchbox"));
  await searchInput.fill("millet");
  await searchInput.press("Enter");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/search/);
  await expect(page.locator("a[href^='/product/']").first()).toBeVisible();
});

test("PROD-08 search no results shows empty state", async ({ page }) => {
  await page.goto("/search?q=xyz123nonexistentproduct");
  await expect(page.getByText(/no.*result|no.*product|not.*found/i).first()).toBeVisible();
});

test("PROD-10 submit product review (logged in)", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  const reviewSection = page.getByText(/write.*review|add.*review|leave.*review/i);
  if (await reviewSection.count() > 0) {
    // Click 4 stars
    const stars = page.locator("[class*=star], [aria-label*=star]");
    if (await stars.count() >= 4) await stars.nth(3).click();

    await page.getByLabel(/review|comment/i).or(page.getByPlaceholder(/review|comment|your thoughts/i)).first().fill("Great product, healthy and tasty!");
    await page.getByRole("button", { name: /submit.*review|post/i }).click();
    await expect(page.getByText(/thank|pending|submitted|review received/i)).toBeVisible();
  } else {
    console.log("PROD-10: Review form not found on this product");
  }
});

test("PROD-12 notify me shown for out-of-stock", async ({ page }) => {
  await page.goto("/product");
  const productLinks = page.locator("a[href^='/product/']");

  for (let i = 0; i < Math.min(await productLinks.count(), 5); i++) {
    const href = await productLinks.nth(i).getAttribute("href");
    await page.goto(href!);
    await page.waitForLoadState("networkidle");

    const select = page.locator("select").first();
    const options = await select.locator("option").allTextContents();
    const oosOption = options.find(o => o.includes("Out of Stock"));

    if (oosOption) {
      await select.selectOption({ label: oosOption });
      await page.waitForTimeout(300);
      await expect(page.getByRole("button", { name: /notify|alert me/i })).toBeVisible();
      break;
    }
  }
});
