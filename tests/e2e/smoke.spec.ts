/**
 * STAGING SMOKE SUITE — runs against any deployment URL via TEST_BASE_URL.
 * Public routes only, no auth. Target: < 90 seconds total.
 * Must pass before merging to main (enforced by branch protection rule).
 */
import { test, expect } from "@playwright/test";

// Inject the Vercel bypass header on every browser request (navigation included).
// extraHTTPHeaders in playwright.config.ts works for the request fixture (raw
// HTTP) but not for Chromium browser navigations via CDP. page.route() intercepts
// at Playwright's network layer and reliably adds headers to navigation requests.
test.beforeEach(async ({ page }) => {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypassSecret) {
    await page.route("**/*", (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-vercel-protection-bypass": bypassSecret,
        },
      })
    );
  }
});

test("SMOKE-01 health endpoint returns 200", async ({ request }) => {
  const res = await request.get("/api/healthz");
  const body = await res.json().catch(() => ({}));
  expect(res.status(), `healthz body: ${JSON.stringify(body)}`).toBe(200);
  expect(body.status).toBe("ok");
});

test("SMOKE-02 homepage loads with brand name", async ({ page }) => {
  // domcontentloaded: title is in <head> (first streaming chunk); no need to
  // wait for body streaming or network-idle.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/srilaya/i);
  await expect(page).not.toHaveTitle(/error|not found/i);
});

test("SMOKE-03 products listing renders at least one product", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  const productLinks = page.locator("a[href^='/product/']");
  // No explicit timeout — global 30s accommodates cold-start DB latency
  await expect(productLinks.first()).toBeVisible();
  expect(await productLinks.count()).toBeGreaterThan(0);
});

test("SMOKE-04 product detail page loads with price and Add to Cart", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  const firstLink = page.locator("a[href^='/product/']").first();
  await expect(firstLink).toBeVisible();
  const href = await firstLink.getAttribute("href");
  expect(href).toBeTruthy();

  await page.goto(href!, { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText(/₹\s*\d+/).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /add to cart|out of stock/i }).first()
  ).toBeVisible();
});

test("SMOKE-05 search returns results for 'millet'", async ({ page }) => {
  await page.goto("/search?q=millet", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  const results = page.locator("a[href^='/product/']").or(
    page.getByText(/\d+\s+result/i)
  );
  await expect(results.first()).toBeVisible();
});

test("SMOKE-06 cart page loads (empty state is fine)", async ({ page }) => {
  await page.goto("/cart", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // <main> is in the layout shell — appears before any DB query resolves
  await expect(page.locator("main")).toBeVisible();
  await expect(
    page.getByText(/cart|bag|empty|your order/i).first()
  ).toBeVisible();
});

test("SMOKE-07 blog listing loads at least one post", async ({ page }) => {
  await page.goto("/blog", { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("h1, h2, h3").first()).toBeVisible();
});

test("SMOKE-08 key static pages render without 500", async ({ page }) => {
  const routes = ["/about", "/contact", "/privacy", "/terms", "/shipping-policy"];
  for (const route of routes) {
    const res = await page.goto(route, { waitUntil: "networkidle" });
    expect(
      res?.status(),
      `${route} returned ${res?.status()}`
    ).not.toBe(500);
    // <main> is in the layout shell — fast check that page loaded without crashing
    await expect(
      page.locator("main").first(),
      `${route} has no main element`
    ).toBeVisible();
  }
});

test("SMOKE-09 sitemap.xml is valid XML with at least one URL", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("<urlset");
  expect(text).toContain("<loc>");
  expect(text).toMatch(/<loc>https:\/\//i);
});

test("SMOKE-10 robots.txt disallows /admin on staging", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("Disallow: /admin");
});

test("SMOKE-11 wishlist page loads without error (guest empty state)", async ({ page }) => {
  await page.goto("/wishlist", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Must not show the error boundary
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  // h1 page title must be visible (h2 "Your wishlist is empty" also contains "wishlist", use level:1)
  await expect(page.getByRole("heading", { name: /wishlist/i, level: 1 })).toBeVisible();
});

test("SMOKE-12 product listing shows wishlist heart button on product cards", async ({ page }) => {
  await page.goto("/product", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // WishlistButton is rendered on each product card in the listing
  await expect(
    page.getByRole("button", { name: /wishlist/i }).first()
  ).toBeVisible({ timeout: 10000 });
});

test("SMOKE-13 /rava landing page loads with hero heading", async ({ page }) => {
  await page.goto("/rava", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  // h1 hero heading must be visible
  await expect(
    page.getByRole("heading", { name: /granular gems/i, level: 1 })
  ).toBeVisible();
});

test("SMOKE-14 /rava product grid renders all 7 variety cards", async ({ page }) => {
  await page.goto("/rava", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Each variety card has an h3 with the product name — check a spread of them
  for (const name of ["Foxtail Rava", "Finger Rava", "Barnyard Rava", "Mapillai Samba Rava"]) {
    await expect(
      page.getByRole("heading", { name, level: 3 })
    ).toBeVisible();
  }
  // Total: all 7 h3 product headings should be present in "All Varieties" default view
  expect(await page.getByRole("heading", { level: 3 }).count()).toBeGreaterThanOrEqual(7);
});

test("SMOKE-15 /rava filter buttons narrow the visible product cards", async ({ page }) => {
  await page.goto("/rava", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);

  // Scope to the product grid section — other sections also have h3 (benefits cards)
  const grid = page.locator("#collection");

  // Default "All Varieties" shows 7 product cards
  const allCount = await grid.getByRole("heading", { level: 3 }).count();
  expect(allCount).toBe(7);

  // "Diabetic Care" filter — foxtail + barnyard are tagged; count must drop
  await page.getByRole("button", { name: /diabetic care/i }).click();
  const diabeticCount = await grid.getByRole("heading", { level: 3 }).count();
  expect(diabeticCount).toBeGreaterThan(0);
  expect(diabeticCount).toBeLessThan(allCount);

  // Restoring "All Varieties" shows all 7 again
  await page.getByRole("button", { name: /all varieties/i }).click();
  expect(await grid.getByRole("heading", { level: 3 }).count()).toBe(7);
});

test("SMOKE-16 /rava floating WhatsApp button is present", async ({ page }) => {
  await page.goto("/rava", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Floating button in hero and fixed floating button
  await expect(
    page.getByRole("button", { name: /chat on whatsapp/i }).first()
  ).toBeVisible();
});

test("SMOKE-22 /muesli landing page loads with hero and product cards", async ({ page }) => {
  await page.goto("/muesli", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: /wake up to/i, level: 1 })
  ).toBeVisible();
  for (const name of ["Honey Muesli & Granola", "Chocolate Muesli", "Sugar Free Muesli"]) {
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
  }
});

test("SMOKE-21 /traditional-rice landing page loads with hero and all 4 varieties", async ({ page }) => {
  await page.goto("/traditional-rice", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: /ancient gems/i, level: 1 })
  ).toBeVisible();
  for (const name of ["Mapillai Samba Rice", "Karupu Kavuni Rice", "Poongar Rice", "Seeraga Samba Rice"]) {
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
  }
});

test("SMOKE-20 /sweeteners landing page loads with hero heading and all 3 varieties", async ({ page }) => {
  await page.goto("/sweeteners", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: /sweet without/i, level: 1 })
  ).toBeVisible();
  for (const name of ["Sugarcane Jaggery Powder", "Palm Jaggery Powder", "Coconut Jaggery Powder"]) {
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
  }
});

test("SMOKE-18 /flour landing page loads with hero heading and product cards", async ({ page }) => {
  await page.goto("/flour", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: /bake better/i, level: 1 })
  ).toBeVisible();
  for (const name of ["Foxtail Flour", "Finger Flour (Ragi)", "Sprouted Ragi Flour"]) {
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
  }
});

test("SMOKE-19 /collections page shows 2 live collections", async ({ page }) => {
  await page.goto("/collections", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  const liveBadges = page.getByText("Live", { exact: true });
  expect(await liveBadges.count()).toBeGreaterThanOrEqual(2);
});

test("SMOKE-23 /raw-millets landing page loads with hero and product cards", async ({ page }) => {
  await page.goto("/raw-millets", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: /nature.s supergrains/i, level: 1 })
  ).toBeVisible();
  for (const name of ["Foxtail Millet Grains", "Finger (Ragi) Millet Grains", "Pearl Millet Grains (Bajra)"]) {
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
  }
});

test("SMOKE-24 /parboiled-millets landing page loads with hero and product cards", async ({ page }) => {
  await page.goto("/parboiled-millets", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: /nutritional milestone/i, level: 1 })
  ).toBeVisible();
  for (const name of ["Parboiled Foxtail Millet", "Parboiled Finger (Ragi) Millet", "Parboiled Pearl Millet"]) {
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
  }
});

test("SMOKE-17 /recipes shows all 3 featured millet rava recipe cards", async ({ page }) => {
  await page.goto("/recipes", { waitUntil: "networkidle" });
  await expect(page).not.toHaveTitle(/error|not found/i);
  // Static featured recipes section heading
  await expect(
    page.getByRole("heading", { name: /featured millet rava recipes/i })
  ).toBeVisible();
  // All 3 recipe card headings must render
  for (const title of ["Millet Upma", "Rava Kheer", "Millet Pongal"]) {
    await expect(
      page.getByRole("heading", { name: title })
    ).toBeVisible();
  }
});
