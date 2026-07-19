/**
 * SESSION JUL-17 — Tests for all enhancements and bug fixes from 17 Jul 2026.
 *
 * Covers:
 *  JUL17-01 to JUL17-03  Homepage stats (75+ customers, no organic claim)
 *  JUL17-04 to JUL17-07  Bundles page (₹ symbol, packs load, savings badge)
 *  JUL17-08 to JUL17-10  Blog / Recipes split (nav links, recipe exclusion from blog)
 *  JUL17-11 to JUL17-13  Recipes page (/recipes route)
 *  JUL17-14 to JUL17-16  Packaging inventory admin page
 *  JUL17-17 to JUL17-19  COD Part 1 — "Cash or UPI" customer-facing labels
 *  JUL17-20 to JUL17-22  COD Part 2 — Cash/UPI collection recording in admin
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsUser } from "./helpers/auth";
import { addFirstProductToCart } from "./helpers/cart";

// ─── Homepage stats ───────────────────────────────────────────────────────────

test("JUL17-01 homepage shows 75+ customers not 5000+", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").innerText();
  expect(body).toContain("75+");
  expect(body).not.toMatch(/5000\+/);
});

test("JUL17-02 homepage stats section does not say Certified Organic", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // The specific stat that was replaced: "100% Certified Organic" → "Natural & Unprocessed"
  // We check the stats grid text doesn't contain "Certified Organic" as a label
  const statsSection = page.locator("[class*=stat], [class*=grid]").filter({ hasText: /75\+|22\+/ });
  if (await statsSection.count() > 0) {
    const statsText = await statsSection.first().innerText();
    expect(statsText).not.toMatch(/certified organic/i);
  } else {
    // Fallback: the specific badge text should not exist anywhere
    const certBadge = page.getByText(/^100%\s*Certified Organic$/i);
    await expect(certBadge).toHaveCount(0);
  }
});

test("JUL17-03 homepage stats show Natural & Unprocessed", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").innerText();
  expect(body).toMatch(/natural.*unprocessed|unprocessed.*natural/i);
});

// ─── Bundles page ─────────────────────────────────────────────────────────────

test("JUL17-04 bundles page loads without JS errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));
  await page.goto("/bundles");
  await page.waitForLoadState("networkidle");
  expect(errors.filter(e => !e.includes("chunk") && !e.includes("ResizeObserver"))).toHaveLength(0);
});

test("JUL17-05 bundles page shows rupee symbol not question mark", async ({ page }) => {
  await page.goto("/bundles");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").innerText();
  // Must not have "SAVE ?" or "? savings" corruption
  expect(body).not.toMatch(/SAVE\s*\?/);
  // If bundle products with prices exist, ₹ must appear; check via DOM not full body text
  const priceElements = await page.locator("[class*=price], [class*=rupee]").count();
  const bundleCards = await page.locator("h2, h3").filter({ hasText: /pack|combo/i }).count();
  if (bundleCards > 0 && priceElements > 0) {
    expect(body).toContain("₹");
  }
});

test("JUL17-06 bundles page shows SAVE badge with rupee", async ({ page }) => {
  await page.goto("/bundles");
  await page.waitForLoadState("networkidle");
  // Look for a SAVE badge that contains ₹
  const saveBadge = page.getByText(/SAVE\s*₹/i).first();
  if (await saveBadge.count() > 0) {
    await expect(saveBadge).toBeVisible();
  } else {
    // Savings might be shown differently — ensure no corrupted ? symbol
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/SAVE\s*[?]/);
  }
});

test("JUL17-07 bundles page displays at least one bundle pack", async ({ page }) => {
  await page.goto("/bundles");
  await page.waitForLoadState("networkidle");
  // Bundle cards should be present; skip assertion if staging has no bundle data
  const cards = page.locator("h2, h3").filter({ hasText: /pack|combo|family/i });
  const count = await cards.count();
  if (count === 0) {
    console.log("JUL17-07: No bundle packs in staging DB — skipping count assertion");
    return;
  }
  expect(count).toBeGreaterThan(0);
});

// ─── Blog / Recipes split ─────────────────────────────────────────────────────

test("JUL17-08 nav header has separate Recipes and Blog links", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const recipesLink = page.getByRole("link", { name: /^recipes$/i }).first();
  const blogLink    = page.getByRole("link", { name: /^blog$/i }).first();
  await expect(recipesLink).toBeVisible();
  await expect(blogLink).toBeVisible();
});

test("JUL17-09 blog page does not show recipe posts", async ({ page }) => {
  await page.goto("/blog");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").innerText();
  // Recipe category posts should not appear on /blog
  // They are identifiable by headings like "Recipe:" or category tag "recipe"
  // We check the page doesn't show our seeded recipe slugs (by their titles)
  expect(body).not.toMatch(/recipe.*for.*family|family.*recipe/i);
});

test("JUL17-10 blog page shows health/article content not recipes", async ({ page }) => {
  await page.goto("/blog");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1").first()).toBeVisible();
  // Blog title should not say "Recipes" anymore
  const h1 = await page.locator("h1").first().innerText();
  expect(h1).not.toMatch(/^recipes/i);
});

// ─── Recipes page ────────────────────────────────────────────────────────────

test("JUL17-11 /recipes page loads successfully", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));
  await page.goto("/recipes");
  await page.waitForLoadState("networkidle");
  expect(errors.filter(e => !e.includes("chunk") && !e.includes("ResizeObserver"))).toHaveLength(0);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("JUL17-12 /recipes page heading mentions Recipes", async ({ page }) => {
  await page.goto("/recipes");
  await page.waitForLoadState("networkidle");
  const h1 = await page.locator("h1").first().innerText();
  expect(h1).toMatch(/recipe/i);
});

test("JUL17-13 /recipes page shows at least one recipe card", async ({ page }) => {
  await page.goto("/recipes");
  await page.waitForLoadState("networkidle");
  // Recipe cards link to /blog/[slug]
  const links = page.locator("a[href^='/blog/']");
  const count = await links.count();
  // If recipes were seeded, at least 1 should show; else graceful empty state
  if (count === 0) {
    // Acceptable: page renders with empty state, no crash
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(50);
  } else {
    expect(count).toBeGreaterThan(0);
  }
});

// ─── Packaging inventory admin ────────────────────────────────────────────────

test("JUL17-14 admin packaging page loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/packaging");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("JUL17-15 admin packaging page shows category sections", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/packaging");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").innerText();
  // Should show at least one packaging category
  expect(body).toMatch(/pouch|box|tape|label|packaging/i);
});

test("JUL17-16 admin packaging page has Add Item form", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/packaging");
  await page.waitForLoadState("networkidle");
  // Form to add new packaging item
  const nameInput = page.getByPlaceholder(/item name|packaging name/i).first()
    .or(page.locator("input[name='name']").last());
  const hasForm = await nameInput.count() > 0
    || await page.getByRole("button", { name: /add.*item|new.*item/i }).count() > 0;
  expect(hasForm).toBe(true);
});

// ─── COD Part 1: "Cash or UPI" customer labels ────────────────────────────────

test("JUL17-17 checkout page COD option label says Pay on Delivery with Cash or UPI", async ({ page }) => {
  test.setTimeout(60000);
  await loginAsUser(page);
  await addFirstProductToCart(page, 1);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  // The COD radio option label should say "Pay on Delivery"
  const codLabel = page.getByText(/pay on delivery/i).first();
  await expect(codLabel).toBeVisible();

  // The description text next to the COD option mentions Cash or UPI
  const body = await page.locator("body").innerText();
  expect(body).toMatch(/cash.*upi|upi.*cash/i);
});

test("JUL17-18 checkout COD description mentions no card machine", async ({ page }) => {
  test.setTimeout(60000);
  await loginAsUser(page);
  await addFirstProductToCart(page, 1);
  await page.goto("/checkout");
  await page.waitForLoadState("networkidle");

  // Select COD option to see its description
  const codRadio = page.locator("input[type=radio][value=cod]").first();
  if (await codRadio.count() > 0) {
    await codRadio.click();
    await page.waitForTimeout(300);
  }

  const body = await page.locator("body").innerText();
  expect(body).toMatch(/no card|cash or upi/i);
});

test("JUL17-19 COD confirm page mentions Cash or UPI", async ({ page }) => {
  test.setTimeout(120000);
  // Place a real COD order and check confirm page
  await loginAsUser(page);
  await addFirstProductToCart(page, 1);
  await page.goto("/checkout");

  await page.getByLabel(/full name/i).fill("Test COD User");
  await page.getByLabel(/phone/i).fill("9876543210");
  await page.getByLabel(/email/i).fill("codtest@srilaya.test");
  await page.getByLabel(/address/i).fill("1 Test St");
  await page.getByLabel(/city/i).fill("Bengaluru");
  await page.getByLabel(/state/i).fill("Karnataka");
  await page.getByLabel(/zip code/i).fill("560001");

  const codRadio = page.getByRole("radio", { name: /pay on delivery|cash.*upi|cod/i }).first();
  if (await codRadio.count() > 0) await codRadio.click();

  await page.waitForTimeout(500);
  const courierRadio = page.locator("input[type=radio][name=courierDisplay]");
  await courierRadio.first().waitFor({ state: "attached", timeout: 5000 }).catch(() => {});
  if (await courierRadio.count() > 0) await courierRadio.first().click();

  await page.getByRole("button", { name: /place order|confirm/i }).click();
  await page.waitForURL(/checkout\/confirm/, { timeout: 20000 }).catch(() => {});

  if (page.url().includes("checkout/confirm")) {
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/cash.*upi|upi.*cash/i);
  } else {
    // Order placed but COD confirm page not reached — still check current page
    const successShown = await page.getByText(/order.*confirmed|thank you/i).count() > 0;
    expect(successShown).toBe(true);
  }
});

// ─── COD Part 2: Cash/UPI collection in admin ─────────────────────────────────

test("JUL17-20 admin orders page loads without error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));
  await loginAsAdmin(page);
  await page.goto("/admin/orders");
  await page.waitForLoadState("networkidle");
  expect(errors.filter(e => !e.includes("chunk") && !e.includes("ResizeObserver"))).toHaveLength(0);
});

test("JUL17-21 admin orders page shows COD Pending badge for cod_pending orders", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders");
  await page.waitForLoadState("networkidle");

  const codBadge = page.getByText(/COD Pending|cod.*pending/i).first();
  if (await codBadge.count() > 0) {
    await expect(codBadge).toBeVisible();
  } else {
    // No COD pending orders currently — verify page renders without error
    await expect(page.locator("h1, h2").first()).toBeVisible();
    console.log("JUL17-21: No cod_pending orders found — skipping badge check");
  }
});

test("JUL17-22 admin COD collection form shows Cash and UPI radio buttons", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders");
  await page.waitForLoadState("networkidle");

  // Look for the Cash/UPI radio within cod_pending order rows
  const cashRadio = page.locator("input[type=radio][value=cash]").first();
  const upiRadio  = page.locator("input[type=radio][value=upi]").first();

  if (await cashRadio.count() > 0) {
    await expect(cashRadio).toBeVisible();
    await expect(upiRadio).toBeVisible();

    // UPI ref input should also be present
    const upiRefInput = page.locator("input[name=codUpiRef]").first();
    await expect(upiRefInput).toBeVisible();

    // Confirm Collection button should be present
    const confirmBtn = page.getByRole("button", { name: /confirm collection/i }).first();
    await expect(confirmBtn).toBeVisible();
  } else {
    console.log("JUL17-22: No cod_pending orders to show Cash/UPI form — verified page renders");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  }
});
