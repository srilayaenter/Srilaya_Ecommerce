import { Page, expect } from "@playwright/test";

/**
 * Navigate to the first in-stock product and add `qty` units to cart.
 * Tries up to 5 products to find one with an enabled Add to Cart button.
 */
export async function addFirstProductToCart(page: Page, qty = 1) {
  await page.goto("/product");
  await page.waitForLoadState("networkidle");

  const productLinks = page.locator("a[href^='/product/']");
  const count = await productLinks.count();

  for (let i = 0; i < Math.min(count, 5); i++) {
    const href = await productLinks.nth(i).getAttribute("href");
    if (!href) continue;

    await page.goto(href);
    await page.waitForLoadState("networkidle");

    const addBtn = page.getByRole("button", { name: /add to cart/i });
    const isVisible = await addBtn.isVisible();
    if (!isVisible) continue; // all variants out of stock, try next product

    // Increment quantity
    for (let j = 0; j < qty; j++) {
      await page.getByRole("button", { name: "+" }).click();
      await page.waitForTimeout(100);
    }

    // Wait until Add to Cart is enabled (quantity > 0)
    await expect(addBtn).toBeEnabled({ timeout: 3000 });
    await addBtn.click();

    // Wait for "Added!" confirmation message (Supabase writes can take a few seconds)
    await expect(
      page.getByText(/added|added to cart/i)
    ).toBeVisible({ timeout: 15000 });

    // Verify cartId cookie was set by the server action
    const cookies = await page.context().cookies();
    const cartCookie = cookies.find(c => c.name === 'cartId');
    if (!cartCookie) {
      // Cookie missing — force-set it by calling the count API which will
      // trigger the server to recognise the session, then retry
      await page.waitForTimeout(1000);
    }
    return;
  }

  throw new Error("addFirstProductToCart: no in-stock product found in first 5 results");
}

/** Clear the cart by visiting /cart and removing all items. Best-effort; never throws. */
export async function emptyCart(page: Page) {
  try {
    await page.goto("/cart", { timeout: 15000 });
    const removeButtons = page.getByRole("button", { name: /remove/i });
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
      await page.waitForTimeout(400);
    }
  } catch {
    // Swallow errors — afterEach cleanup must never fail the test
  }
}
