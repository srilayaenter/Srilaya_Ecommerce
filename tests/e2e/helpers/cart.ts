import { Page } from "@playwright/test";

/** Navigate to the first available product and add `qty` units to cart. */
export async function addFirstProductToCart(page: Page, qty = 1) {
  await page.goto("/product");
  await page.locator("a[href^='/product/']").first().click();
  await page.waitForLoadState("networkidle");

  // Increase quantity qty times
  for (let i = 0; i < qty; i++) {
    await page.getByRole("button", { name: "+" }).click();
  }
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForTimeout(800);
}

/** Clear the cart by visiting /cart and removing all items. */
export async function emptyCart(page: Page) {
  await page.goto("/cart");
  const removeButtons = page.getByRole("button", { name: /remove/i });
  const count = await removeButtons.count();
  for (let i = 0; i < count; i++) {
    await removeButtons.first().click();
    await page.waitForTimeout(400);
  }
}
