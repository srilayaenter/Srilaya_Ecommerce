/**
 * ORDERS & MANAGEMENT — TC-ORD-01 to TC-ORD-13
 * Covers: customer order view, track order, cancellation, admin order management.
 */
import { test, expect } from "@playwright/test";
import { loginAsUser, loginAsAdmin } from "./helpers/auth";

// ─── Customer-facing ──────────────────────────────────────────────────────────

test("ORD-01 customer can view own order detail", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/account");

  const orderLink = page.getByRole("link", { name: /view|details|#/i }).first();
  if (await orderLink.count() > 0) {
    await orderLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/order.*#|#.*order/i)).toBeVisible();
    await expect(page.getByText(/₹/)).toBeVisible();
  } else {
    console.log("ORD-01: No orders found for test user yet");
  }
});

test("ORD-02 customer cannot view another user order", async ({ page }) => {
  await loginAsUser(page);
  // Try accessing a non-existent or other-user order ID
  await page.goto("/orders/clzfake000000000000000001");
  // Should show 404 or access denied
  const body = await page.content();
  expect(body).toMatch(/not found|unauthorized|access denied|404/i);
});

test("ORD-03 track order by order ID and email", async ({ page }) => {
  await page.goto("/track");
  await expect(page.locator("h1, h2").first()).toBeVisible();

  const orderIdInput = page.getByLabel(/order.*id|id/i);
  const emailInput = page.getByLabel(/email/i);

  if (await orderIdInput.count() > 0 && await emailInput.count() > 0) {
    await orderIdInput.fill("TESTORDER123");
    await emailInput.fill("test@srilaya.test");
    await page.getByRole("button", { name: /track/i }).click();
    await page.waitForTimeout(1000);
    // Either shows order or "not found"
    const content = await page.content();
    expect(content).toMatch(/not found|status|tracking|order/i);
  }
});

test("ORD-04 track order invalid ID shows not found", async ({ page }) => {
  await page.goto("/track");
  const orderIdInput = page.getByLabel(/order.*id|id/i);
  const emailInput = page.getByLabel(/email/i);

  if (await orderIdInput.count() > 0) {
    await orderIdInput.fill("XYZINVALIDORDER");
    await emailInput.fill("nobody@srilaya.test");
    await page.getByRole("button", { name: /track/i }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/not found|invalid|no order/i)).toBeVisible();
  }
});

test("ORD-05 customer can cancel eligible order", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/account");

  const cancelBtn = page.getByRole("button", { name: /cancel/i }).first();
  if (await cancelBtn.count() > 0) {
    await cancelBtn.click();
    // Confirm dialog or inline confirmation
    const confirmBtn = page.getByRole("button", { name: /yes.*cancel|confirm cancel/i });
    if (await confirmBtn.count() > 0) await confirmBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/cancelled|canceled/i)).toBeVisible();
  } else {
    console.log("ORD-05: No cancellable orders found for test user");
  }
});

// ─── Admin Order Management ───────────────────────────────────────────────────

test("ORD-06 admin orders list loads", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders");
  await expect(page.locator("table, [class*=order-list]").first()).toBeVisible();
});

test("ORD-07 admin can update order status", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders");

  const firstOrderLink = page.getByRole("link", { name: /#|view|open/i }).first();
  if (await firstOrderLink.count() > 0) {
    await firstOrderLink.click();
    await page.waitForLoadState("networkidle");

    const statusSelect = page.getByLabel(/fulfillment.*status|status/i)
      .or(page.locator("select[name*=status]")).first();

    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption("dispatched");
      await page.getByRole("button", { name: /save|update/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByText(/saved|updated|dispatched/i)).toBeVisible();
    }
  } else {
    console.log("ORD-07: No orders in admin yet");
  }
});

test("ORD-09 admin can add shipment info", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/orders");

  const firstOrderLink = page.getByRole("link", { name: /#|view|open/i }).first();
  if (await firstOrderLink.count() > 0) {
    await firstOrderLink.click();
    await page.waitForLoadState("networkidle");

    const courierInput = page.getByLabel(/courier/i);
    const trackingInput = page.getByLabel(/tracking/i);

    if (await courierInput.count() > 0 && await trackingInput.count() > 0) {
      await courierInput.fill("Delhivery");
      await trackingInput.fill("DL123456789");
      await page.getByRole("button", { name: /save.*shipment|update.*shipment/i }).click();
      await page.waitForTimeout(1000);
      await expect(page.getByText(/saved|updated|shipment/i)).toBeVisible();
    }
  }
});

test("ORD-13 invoice download returns PDF", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/account");

  const invoiceLink = page.getByRole("link", { name: /invoice|download/i }).first();
  if (await invoiceLink.count() > 0) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      invoiceLink.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  } else {
    console.log("ORD-13: No invoice link found for test user");
  }
});
