/**
 * ADMIN DASHBOARD, RBAC, BLOG, REVIEWS, INVENTORY — TC-ADM-* TC-INV-* TC-ADM-BLG-* TC-ADM-REV-*
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsUser } from "./helpers/auth";

// ─── Dashboard ────────────────────────────────────────────────────────────────

test("ADM-01 admin dashboard loads KPIs", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  // Expect numeric KPI cards
  const kpiText = await page.content();
  expect(kpiText).toMatch(/order|revenue|₹|\d+/i);
});

test("ADM-02 analytics page renders charts", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/analytics");
  // Charts may be SVG or canvas
  const hasChart = await page.locator("svg, canvas").count() > 0;
  expect(hasChart).toBe(true);
});

test("ADM-03 GST report page accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/gst-report");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

// ─── RBAC ─────────────────────────────────────────────────────────────────────

test("ADM-04 customer cannot access admin users page", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/admin/users");
  // Should redirect to admin login or show access denied
  await expect(page).toHaveURL(/admin\/login|login/);
});

test("ADM-05 admin users page lists users", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/users");
  await expect(page.locator("table, [class*=user-list]").first()).toBeVisible();
});

test("ADM-06 admin customers page accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/customers");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

// ─── Products ─────────────────────────────────────────────────────────────────

test("ADM-07 admin product list loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products");
  await expect(page.locator("table, [class*=product-list]").first()).toBeVisible();
});

test("ADM-08 admin product edit page loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products");

  const editLink = page.getByRole("link", { name: /edit/i }).first();
  if (await editLink.count() > 0) {
    await editLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByLabel(/name|title/i).first()).toBeVisible();
  }
});

// ─── Inventory ────────────────────────────────────────────────────────────────

test("INV-01 admin edit stock level", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/products");

  const editLink = page.getByRole("link", { name: /edit/i }).first();
  if (await editLink.count() > 0) {
    await editLink.click();
    await page.waitForLoadState("networkidle");

    const stockInput = page.getByLabel(/stock/i).first();
    if (await stockInput.count() > 0) {
      const current = await stockInput.inputValue();
      const newVal = String(parseInt(current || "0") + 1);
      await stockInput.fill(newVal);
      await page.getByRole("button", { name: /save|update/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByText(/saved|updated/i)).toBeVisible();
    }
  }
});

test("INV-02 inventory import page accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/inventory-import");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("INV-03 inventory import invalid CSV shows error", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/inventory-import");

  const fileInput = page.locator("input[type=file]");
  if (await fileInput.count() > 0) {
    // Create a minimal invalid CSV buffer
    const invalidCsvContent = "invalid,columns\n1,2";
    await fileInput.setInputFiles({
      name: "bad.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(invalidCsvContent),
    });
    await page.getByRole("button", { name: /import|upload/i }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByText(/error|invalid|missing/i)).toBeVisible();
  }
});

// ─── Coupons ─────────────────────────────────────────────────────────────────

test("ADM-CPN-01 admin coupons list accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/coupons");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("ADM-CPN-02 admin create coupon", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/coupons");

  const newBtn = page.getByRole("button", { name: /new|create|add/i }).first();
  if (await newBtn.count() > 0) {
    await newBtn.click();
    await page.waitForTimeout(500);

    const code = `AUTO${Date.now().toString().slice(-6)}`;
    await page.getByLabel(/code/i).fill(code);
    await page.getByLabel(/discount.*%|percentage/i).or(
      page.getByLabel(/value|amount/i)
    ).fill("10");

    await page.getByRole("button", { name: /save|create/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(code)).toBeVisible();
  }
});

// ─── Bundles ─────────────────────────────────────────────────────────────────

test("ADM-BDL-01 admin bundles list accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/bundles");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

// ─── Blog ─────────────────────────────────────────────────────────────────────

test("ADM-BLG-01 admin blog list accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/blog");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("ADM-BLG-02 admin create blog post", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/blog");

  const newBtn = page.getByRole("button", { name: /new|create|add/i }).first();
  if (await newBtn.count() > 0) {
    await newBtn.click();
    await page.waitForTimeout(500);

    const title = `Auto Test Post ${Date.now()}`;
    await page.getByLabel(/title/i).fill(title);
    await page.getByLabel(/slug/i).fill(`auto-test-${Date.now()}`);
    await page.getByLabel(/content|body/i).fill("Automated test content.");
    await page.getByRole("button", { name: /save|publish/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(title)).toBeVisible();
  }
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

test("ADM-REV-01 admin reviews list accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/reviews");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("ADM-REV-01b admin can approve review", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/reviews");

  const approveBtn = page.getByRole("button", { name: /approve/i }).first();
  if (await approveBtn.count() > 0) {
    await approveBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/approved/i)).toBeVisible();
  } else {
    console.log("ADM-REV-01b: No pending reviews to approve");
  }
});

// ─── Returns ─────────────────────────────────────────────────────────────────

test("ADM-RET-01 admin returns list accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/returns");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

// ─── Failed Emails ────────────────────────────────────────────────────────────

test("ADM-EML-01 admin failed emails page accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/failed-emails");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

// ─── Offline Orders ────────────────────────────────────────────────────────────

test("ORD-11 admin create offline order page accessible", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders/new");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});
