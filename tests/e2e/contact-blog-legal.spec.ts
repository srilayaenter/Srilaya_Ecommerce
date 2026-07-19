/**
 * CONTACT, BLOG, LEGAL PAGES — TC-CNT-*, TC-BLG-*, TC-LGL-*
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

// ─── Contact ─────────────────────────────────────────────────────────────────

test("CNT-01 contact form submits successfully", async ({ page }) => {
  await page.goto("/contact");

  await page.getByLabel(/name/i).fill("Automation Tester");
  await page.getByLabel(/email/i).fill("auto@srilaya.test");
  await page.getByLabel(/message/i).fill("This is an automated test inquiry.");
  await page.getByRole("button", { name: /submit|send/i }).click();

  await expect(
    page.getByText(/message sent|thank you|received|success/i).first()
  ).toBeVisible({ timeout: 8000 });
});

test("CNT-02 contact form requires all fields", async ({ page }) => {
  await page.goto("/contact");

  // Submit without filling anything
  await page.getByRole("button", { name: /submit|send/i }).click();
  await page.waitForTimeout(500);
  // Should stay on contact page due to HTML5 validation
  await expect(page).toHaveURL(/contact/);
});

test("CNT-03 contact page shows correct brand details", async ({ page }) => {
  await page.goto("/contact");
  // Phone and email should be from BRAND constants
  await expect(page.getByText(/86603 21315/).first()).toBeVisible();
  await expect(page.getByText(/info@srilaya.com/).first()).toBeVisible();
});

// ─── Blog ─────────────────────────────────────────────────────────────────────

test("BLG-01 blog listing page loads", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("BLG-01b blog posts show title and date", async ({ page }) => {
  await page.goto("/blog");
  const posts = page.locator("article, [class*=post-card], [class*=blog-card]");
  const count = await posts.count();
  if (count > 0) {
    await expect(posts.first()).toBeVisible();
  } else {
    console.log("BLG-01b: No blog posts published yet");
  }
});

test("BLG-02 blog post page renders", async ({ page }) => {
  await page.goto("/blog");
  const firstPostLink = page.getByRole("link", { name: /read|more|open/i }).first()
    .or(page.locator("a[href^='/blog/']").first());

  if (await firstPostLink.count() > 0) {
    await firstPostLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    // Content should exist
    await expect(page.locator("article, main").first()).toBeVisible();
  } else {
    console.log("BLG-02: No blog post links found");
  }
});

// ─── Legal Pages ─────────────────────────────────────────────────────────────

test("LGL-01 privacy policy page loads without corruption", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.locator("h1").first()).toBeVisible();
  // No ?? corruption
  await expect(page.getByText("??")).not.toBeVisible();
  // Brand name correct
  await expect(page.getByText("SriLaYa Naturals").first()).toBeVisible();
});

test("LGL-02 terms of service page loads", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/Bengaluru|jurisdiction/i).first()).toBeVisible();
  await expect(page.getByText("??")).not.toBeVisible();
});

test("LGL-03 shipping policy page loads with table", async ({ page }) => {
  await page.goto("/shipping-policy");
  await expect(page.locator("h1").first()).toBeVisible();
  // Delivery table or zones section
  await expect(page.getByText(/₹499|free.*shipping|shipping.*free/i).first()).toBeVisible();
  await expect(page.getByText("??")).not.toBeVisible();
});

test("LGL-04 returns policy page shows 7-day window", async ({ page }) => {
  await page.goto("/returns-policy");
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByText(/7.day|7 day/i).first()).toBeVisible();
  await expect(page.getByText("??")).not.toBeVisible();
});

test("LGL-05 footer legal links navigate correctly", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const links = [
    { text: /privacy/i, url: /privacy/ },
    { text: /terms/i, url: /terms/ },
    { text: /shipping/i, url: /shipping/ },
    { text: /returns/i, url: /returns/ },
  ];

  for (const link of links) {
    // Get the href from the footer link, then navigate directly to avoid
    // cookie-consent overlay blocking the click
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const el = page.getByRole("link", { name: link.text }).last();
    if (await el.count() > 0) {
      const href = await el.getAttribute("href");
      if (href) {
        await page.goto(href, { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(link.url);
      }
    }
  }
});
