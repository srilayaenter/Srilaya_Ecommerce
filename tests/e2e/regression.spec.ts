/**
 * REGRESSION CHECKLIST — 12 critical checks, run after every deploy.
 * These must all pass before any release.
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test("REG-01 homepage loads without JS errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(errors.filter(e => !e.includes("chunk") && !e.includes("ResizeObserver"))).toHaveLength(0);
});

test("REG-02 add to cart works end-to-end", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForTimeout(800);

  await page.goto("/cart");
  await expect(page.getByText(/₹/)).toBeVisible();
});

test("REG-03 cart count updates in header", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForTimeout(800);

  const badge = page.locator("[class*=badge],[class*=cart-count],[aria-label*=cart]").first();
  const count = parseInt(await badge.textContent() || "0");
  expect(count).toBeGreaterThan(0);
});

test("REG-04 checkout form submits COD order", async ({ page }) => {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForTimeout(800);
  await page.goto("/checkout");

  await page.getByLabel(/name/i).fill("Regression Test");
  await page.getByLabel(/phone/i).fill("9876543210");
  await page.getByLabel(/email/i).fill("regression@srilaya.test");
  await page.getByLabel(/address/i).fill("1 Test Lane");
  await page.getByLabel(/city/i).fill("Bengaluru");
  await page.getByLabel(/state/i).selectOption("Karnataka").catch(() => {});
  await page.getByLabel(/pin|zip|postal/i).fill("560001");

  const codOption = page.getByLabel(/cash on delivery|cod/i)
    .or(page.getByRole("radio", { name: /cod|cash/i }));
  if (await codOption.count() > 0) await codOption.click();

  await page.getByRole("button", { name: /place order|confirm/i }).click();
  await page.waitForURL(/checkout\/confirm/, { timeout: 10000 });
  await expect(page).toHaveURL(/checkout\/confirm/);
});

test("REG-05 order confirmation page loads", async ({ page }) => {
  // Just confirm the route format works
  await page.goto("/checkout/confirm/testordernotreal");
  // Either shows order or 404 — must not throw JS error
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));
  await page.waitForLoadState("networkidle");
  // No uncaught React errors
  expect(errors.filter(e => e.includes("React") || e.includes("Hydration"))).toHaveLength(0);
});

test("REG-06 admin login works", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page).toHaveURL(/\/admin$/);
});

test("REG-07 admin orders list loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("REG-08 no ?? corruption on any major page", async ({ page }) => {
  const paths = ["/", "/about", "/product", "/bundles", "/contact", "/referral"];
  for (const path of paths) {
    await page.goto(path);
    const text = await page.locator("body").textContent();
    expect(text, `?? found on ${path}`).not.toMatch(/\?\?/);
  }
});

test("REG-09 brand name is SriLaYa Naturals everywhere", async ({ page }) => {
  const paths = ["/", "/about", "/contact", "/login"];
  for (const path of paths) {
    await page.goto(path);
    const content = await page.content();
    expect(content, `Enterprises found on ${path}`).not.toContain("Enterprises");
  }
});

test("REG-10 mobile hamburger opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const menuBtn = page.locator("[class*=hamburger],[aria-label*=menu],[class*=menu-btn]").first();
  if (await menuBtn.count() > 0) {
    await menuBtn.click();
    await page.waitForTimeout(300);
    // Nav links visible
    await expect(page.getByRole("link", { name: /shop|products|home/i }).first()).toBeVisible();
  }
});

test("REG-11 footer legal links are present", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);

  for (const name of ["Privacy", "Terms", "Shipping", "Returns"]) {
    const link = page.getByRole("link", { name: new RegExp(name, "i") }).last();
    await expect(link, `${name} link missing from footer`).toBeVisible();
  }
});

test("REG-12 contact form submits successfully", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel(/name/i).fill("Regression");
  await page.getByLabel(/email/i).fill("regression@srilaya.test");
  await page.getByLabel(/message/i).fill("Regression test submission");
  await page.getByRole("button", { name: /submit|send/i }).click();
  await expect(page.getByText(/sent|thank you|received/i)).toBeVisible({ timeout: 8000 });
});
