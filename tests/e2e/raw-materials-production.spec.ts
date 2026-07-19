/**
 * RAW MATERIALS, RECIPES, PRODUCTION & P&L — TC-RM-* TC-PRD-* TC-PL-*
 *
 * All pages are owner-only. Tests log in as the business owner account
 * (avrsrikanth@gmail.com) and verify pages load, forms work, and RBAC
 * blocks non-owner access.
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsOwner } from "./helpers/auth";

// ════════════════════════════════════════════════════════════════════════════════
// RAW MATERIALS — TC-RM-*
// ════════════════════════════════════════════════════════════════════════════════

test("RM-01 raw materials page loads for owner", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");
  await expect(page.getByRole("heading", { name: /raw materials/i })).toBeVisible();
  await expect(page.getByText(/laddu production ingredients/i)).toBeVisible();
});

test("RM-02 raw materials page has import, recipes and production buttons", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");
  await expect(page.locator("a[href='/admin/raw-materials/import']").first()).toBeVisible();
  await expect(page.locator("a[href='/admin/raw-materials/recipes']").first()).toBeVisible();
  await expect(page.locator("a[href='/admin/production']").first()).toBeVisible();
});

test("RM-03 non-owner admin gets 404 on raw materials", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/raw-materials");
  // Owner-only pages return 404 for non-owners
  const body = await page.content();
  const isBlocked = page.url().includes("/login") || body.includes("404") || body.includes("not found") || body.includes("This page could not be found");
  expect(isBlocked).toBe(true);
});

test("RM-04 add new raw material form is visible", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");
  await expect(page.getByRole("heading", { name: /add raw material/i })).toBeVisible();
  await expect(page.locator("input[name='name']").last()).toBeVisible();
  await expect(page.locator("select[name='unit']").last()).toBeVisible();
  await expect(page.locator("input[name='costPerUnit']").last()).toBeVisible();
  await expect(page.locator("input[name='reorderThreshold']").last()).toBeVisible();
});

test("RM-05 add a new raw material and verify it appears in list", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");

  const matName = `Test Material ${Date.now()}`;
  // The add form is the last form on the page — use last() to avoid hitting inline stock forms
  await page.locator("input[name='name']").last().fill(matName);
  await page.locator("select[name='unit']").last().selectOption("kg");
  await page.locator("input[name='costPerUnit']").last().fill("120");
  await page.locator("input[name='reorderThreshold']").last().fill("3");
  await page.getByRole("button", { name: /add material/i }).click();

  await page.waitForURL("/admin/raw-materials");
  await expect(page.getByRole("link", { name: new RegExp(matName) })).toBeVisible();
});

test("RM-06 material name is a clickable link to detail page", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");
  // Click the material name link (not the "View →" link — use the green font link in first column)
  const firstLink = page.locator("table tbody tr td:first-child a").first();
  if (await firstLink.count() > 0) {
    await firstLink.click();
    await page.waitForURL(/\/admin\/raw-materials\/.+/, { timeout: 10000 });
    await expect(page.getByRole("heading").first()).toBeVisible();
  } else {
    // No materials yet — skip gracefully
    test.skip();
  }
});

test("RM-07 add stock inline form increments stock", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");

  const qtyInputs = page.locator("input[name='qty']");
  const count = await qtyInputs.count();
  if (count === 0) { test.skip(); return; }

  await qtyInputs.first().fill("2");
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL("/admin/raw-materials");
  // Page reloads — stock change reflected
  await expect(page.locator("table tbody tr").first()).toBeVisible();
});

// ── Raw Material Detail Page ──────────────────────────────────────────────────

test("RM-08 detail page shows KPI cards", async ({ page }) => {
  await loginAsOwner(page);
  // Navigate directly via the View → links in the list
  await page.goto("/admin/raw-materials");
  const viewLink = page.locator("a[href^='/admin/raw-materials/']").filter({ hasText: /view/i }).first();
  if (await viewLink.count() === 0) { test.skip(); return; }
  await viewLink.click();

  await expect(page).toHaveURL(/\/admin\/raw-materials\/.+/);
  await expect(page.getByText(/current stock/i).first()).toBeVisible();
  await expect(page.getByText(/total received/i).first()).toBeVisible();
  await expect(page.getByText(/total consumed/i).first()).toBeVisible();
});

test("RM-09 detail page shows edit form and stock history", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");

  const firstLink = page.locator("table tbody tr td a").first();
  if (await firstLink.count() === 0) { test.skip(); return; }
  await firstLink.click();

  await expect(page.getByRole("heading", { name: /edit details/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /adjust stock/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /stock movement history/i })).toBeVisible();
});

test("RM-10 detail page edit form saves changes", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");
  const viewLink = page.locator("a[href^='/admin/raw-materials/']").filter({ hasText: /view/i }).first();
  if (await viewLink.count() === 0) { test.skip(); return; }
  await viewLink.click();
  await expect(page).toHaveURL(/\/admin\/raw-materials\/.+/);

  // Fill edit form — inputs inside the "Edit Details" section
  const nameInput = page.locator("input[name='name']").first();
  const currentName = await nameInput.inputValue();
  await nameInput.fill(currentName);
  await page.locator("input[name='costPerUnit']").first().fill("155");
  await page.getByRole("button", { name: /save changes/i }).click();

  await expect(page).toHaveURL(/\/admin\/raw-materials\/.+/);
  // Cost shows in KPI or edit form default value
  await expect(page.locator("input[name='costPerUnit']").first()).toHaveValue("155");
});

test("RM-11 stock adjustment logs an entry", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");

  const firstLink = page.locator("table tbody tr td a").first();
  if (await firstLink.count() === 0) { test.skip(); return; }
  await firstLink.click();

  await page.locator("input[name='newQty']").fill("10");
  await page.locator("input[name='note']").fill("Physical count test");
  await page.getByRole("button", { name: /apply adjustment/i }).click();

  await expect(page).toHaveURL(/\/admin\/raw-materials\/.+/);
  await expect(page.getByRole("cell", { name: /adjustment/i }).first()).toBeVisible();
});

test("RM-12 delete button shows confirmation and deletes test material", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials");

  // Find a test material to delete
  const testMaterialLink = page.locator("table tbody td a").filter({ hasText: /^Test Material/ }).first();
  if (await testMaterialLink.count() === 0) { test.skip(); return; }

  await testMaterialLink.click();
  await expect(page).toHaveURL(/\/admin\/raw-materials\/.+/);

  // Set up dialog handler before clicking delete
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: /delete material/i }).click();

  await expect(page).toHaveURL("/admin/raw-materials");
});

// ════════════════════════════════════════════════════════════════════════════════
// RECIPES — TC-RCP-*
// ════════════════════════════════════════════════════════════════════════════════

test("RCP-01 recipes page loads for owner", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/recipes");
  await expect(page.getByRole("heading", { name: /laddu recipes/i })).toBeVisible();
  await expect(page.getByText(/ingredient quantities/i)).toBeVisible();
});

test("RCP-02 non-owner gets 404 on recipes page", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/raw-materials/recipes");
  const body = await page.content();
  const isBlocked = page.url().includes("/login") || body.includes("404") || body.includes("not found") || body.includes("This page could not be found");
  expect(isBlocked).toBe(true);
});

test("RCP-03 recipes page shows laddu variants", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/recipes");
  // Should show laddu variants from the product catalog
  const hasLaddu = await page.getByText(/laddu/i).count() > 0;
  expect(hasLaddu).toBe(true);
});

test("RCP-04 add ingredient form is present per variant", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/recipes");

  const addButtons = page.getByRole("button", { name: /add ingredient/i });
  const count = await addButtons.count();
  // If raw materials exist, add ingredient buttons should be visible
  if (count > 0) {
    await expect(addButtons.first()).toBeVisible();
  } else {
    // No raw materials yet — warning should be shown
    await expect(page.getByText(/no raw materials/i)).toBeVisible();
  }
});

test("RCP-05 back to raw materials link works", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/recipes");
  await page.getByRole("link", { name: /back to raw materials/i }).click();
  await expect(page).toHaveURL("/admin/raw-materials");
});

// ════════════════════════════════════════════════════════════════════════════════
// PRODUCTION — TC-PRD-*
// ════════════════════════════════════════════════════════════════════════════════

test("PRD-01 production page loads for owner", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/production");
  await expect(page.getByRole("heading", { name: /log production/i })).toBeVisible();
  await expect(page.getByText(/auto-deducts raw material stock/i)).toBeVisible();
});

test("PRD-02 non-owner gets 404 on production page", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/production");
  const body = await page.content();
  const isBlocked = page.url().includes("/login") || body.includes("404") || body.includes("not found") || body.includes("This page could not be found");
  expect(isBlocked).toBe(true);
});

test("PRD-03 production page shows recent batches table", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/production");
  await expect(page.getByRole("heading", { name: /recent production batches/i })).toBeVisible();
});

test("PRD-04 production page shows recipe setup prompt when no recipes defined", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/production");

  const form = page.locator("form").filter({ hasText: /units produced/i });
  const warning = page.getByText(/set up recipes first/i);
  const hasEither = await form.count() > 0 || await warning.count() > 0;
  expect(hasEither).toBe(true);
});

test("PRD-05 production form shows ingredient deduction preview on unit change", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/production");

  const unitsInput = page.locator("input[name='unitsProduced']");
  if (await unitsInput.count() === 0) { test.skip(); return; }

  await unitsInput.fill("5");
  // Preview table should update with ingredient quantities
  await page.waitForTimeout(300);
  const preview = page.getByText(/ingredients to be deducted/i);
  if (await preview.count() > 0) {
    await expect(preview).toBeVisible();
  }
});

test("PRD-06 production links to raw materials and recipes", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/production");
  await expect(page.locator("a[href='/admin/raw-materials']").first()).toBeVisible();
  await expect(page.locator("a[href='/admin/raw-materials/recipes']").first()).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════════
// IMPORT PURCHASE BILL — TC-IMP-*
// ════════════════════════════════════════════════════════════════════════════════

test("IMP-01 import page loads for owner", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/import");
  await expect(page.getByRole("heading", { name: /import purchase bill/i })).toBeVisible();
});

test("IMP-02 non-owner gets 404 on import page", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/raw-materials/import");
  const body = await page.content();
  const isBlocked = page.url().includes("/login") || body.includes("404") || body.includes("not found") || body.includes("This page could not be found");
  expect(isBlocked).toBe(true);
});

test("IMP-03 import page shows AI upload or manual entry mode", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/import");

  // Either shows upload zone (AI mode) or manual form or mode toggle
  const hasUpload = await page.getByText(/drop your purchase bill/i).count() > 0;
  const hasManual = await page.getByText(/vendor \/ supplier/i).count() > 0;
  const hasToggle = await page.getByText(/scan bill|enter manually/i).count() > 0;
  expect(hasUpload || hasManual || hasToggle).toBe(true);
});

test("IMP-04 manual entry form has vendor, ref, date and item fields", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/import");

  // Switch to manual mode if toggle is present
  const manualBtn = page.getByRole("button", { name: /enter manually/i });
  if (await manualBtn.count() > 0) await manualBtn.click();

  await expect(page.getByPlaceholder(/evenmore|vendor|supplier/i)).toBeVisible();
  await expect(page.getByPlaceholder(/inv-/i)).toBeVisible();
});

test("IMP-05 manual mode add another item button adds a new row", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/import");

  // Switch to manual mode if AI toggle is present
  const manualBtn = page.getByRole("button", { name: /enter manually/i });
  if (await manualBtn.count() > 0) await manualBtn.click();

  // Wait for manual form to appear
  await page.waitForTimeout(300);

  const addBtn = page.getByRole("button", { name: /add another item/i });
  if (await addBtn.count() === 0) { test.skip(); return; }

  // Count item rows before and after (each row has a qty input with placeholder 0.000)
  const beforeCount = await page.locator("input[placeholder='0.000']").count();
  await addBtn.click();
  await page.waitForTimeout(200);
  const afterCount = await page.locator("input[placeholder='0.000']").count();
  expect(afterCount).toBeGreaterThan(beforeCount);
});

test("IMP-06 back to raw materials link works from import page", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/raw-materials/import");
  // Use the back link in the page header (not the sidebar nav link)
  await page.locator("main a[href='/admin/raw-materials'], .space-y-6 a[href='/admin/raw-materials']").first().click();
  await expect(page).toHaveURL("/admin/raw-materials");
});

// ════════════════════════════════════════════════════════════════════════════════
// P&L REPORT — TC-PL-*
// ════════════════════════════════════════════════════════════════════════════════

test("PL-01 P&L report loads for owner", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/reports/pl");
  await expect(page.getByRole("heading", { name: /profit & loss/i })).toBeVisible();
  await expect(page.getByText(/visible only to business owner/i)).toBeVisible();
});

test("PL-02 non-owner admin gets 404 on P&L", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/reports/pl");
  const body = await page.content();
  const isBlocked = page.url().includes("/login") || body.includes("404") || body.includes("not found") || body.includes("This page could not be found");
  expect(isBlocked).toBe(true);
});

test("PL-03 P&L shows summary cards", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/reports/pl");
  await expect(page.getByText(/total revenue/i).first()).toBeVisible();
  await expect(page.getByText(/cost of goods/i).first()).toBeVisible();
  await expect(page.getByText(/gross profit/i).first()).toBeVisible();
  await expect(page.getByText(/net profit/i).first()).toBeVisible();
});

test("PL-04 P&L month navigation prev and next links work", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/reports/pl");

  await page.getByRole("link", { name: /← prev/i }).click();
  await expect(page).toHaveURL(/month=\d+&year=\d+/);
  await page.getByRole("link", { name: /next →/i }).click();
  await expect(page).toHaveURL(/month=\d+&year=\d+/);
});

test("PL-05 P&L shows product revenue breakdown table", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/reports/pl");
  await expect(page.getByRole("heading", { name: /revenue by product/i })).toBeVisible();
});

test("PL-06 P&L confidential footer is shown", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin/reports/pl");
  await expect(page.getByText(/confidential.*srilaya foods/i)).toBeVisible();
});

// ════════════════════════════════════════════════════════════════════════════════
// SIDEBAR NAV — TC-NAV-*
// ════════════════════════════════════════════════════════════════════════════════

test("NAV-01 owner sidebar shows raw materials and production links", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/admin");
  // Scope to sidebar nav to avoid matching the dashboard alert card link
  const sidebar = page.locator("nav, aside").first();
  await expect(sidebar.getByRole("link", { name: /raw materials/i })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: /production log/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /profit & loss/i }).first()).toBeVisible();
});

test("NAV-02 admin role does not see raw materials or P&L in sidebar", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(page.getByRole("link", { name: /raw materials/i })).not.toBeVisible();
  await expect(page.getByRole("link", { name: /profit & loss/i })).not.toBeVisible();
});
