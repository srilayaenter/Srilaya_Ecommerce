import { Page, expect } from "@playwright/test";

/**
 * Navigate to the first in-stock product and add `qty` units to cart.
 * Tries up to 5 products to find one with an enabled Add to Cart button.
 */
export async function addFirstProductToCart(page: Page, qty = 1) {
  await page.goto("/product", { waitUntil: "domcontentloaded" });
  await page.locator("a[href^='/product/']").first().waitFor({ state: "attached", timeout: 15000 });

  const productLinks = page.locator("a[href^='/product/']");
  const count = await productLinks.count();

  for (let i = 0; i < Math.min(count, 5); i++) {
    const href = await productLinks.nth(i).getAttribute("href");
    if (!href) continue;

    // networkidle ensures the add-to-cart server action has completed before we proceed
    await page.goto(href, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {
      // PostHog may prevent true networkidle — fall through, button waitFor below handles it
    });
    const addBtn = page.getByRole("button", { name: /add to cart/i });
    const isVisible = await addBtn.waitFor({ state: "visible", timeout: 15000 }).then(() => true).catch(() => false);
    if (!isVisible) continue; // all variants out of stock or page not loaded, try next product

    // Increment quantity
    for (let j = 0; j < qty; j++) {
      await page.getByRole("button", { name: "+" }).click();
      await page.waitForTimeout(100);
    }

    // Wait until Add to Cart is enabled (quantity > 0)
    await expect(addBtn).toBeEnabled({ timeout: 3000 });
    await addBtn.click();

    // Wait for "Added!" confirmation message (server action has completed when this shows)
    await expect(
      page.getByText(/added|added to cart/i)
    ).toBeVisible({ timeout: 15000 });

    // Wait for cartId cookie — poll up to 5s since cookie is set by server action
    let cartCookie: { name: string } | undefined;
    for (let attempt = 0; attempt < 10; attempt++) {
      const cookies = await page.context().cookies();
      cartCookie = cookies.find(c => c.name === "cartId");
      if (cartCookie) break;
      await page.waitForTimeout(500);
    }
    if (!cartCookie) {
      // Navigate to cart to force a server-side cart session resolution
      await page.goto("/cart", { waitUntil: "domcontentloaded" });
      const cartCookies = await page.context().cookies();
      cartCookie = cartCookies.find(c => c.name === "cartId");
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
