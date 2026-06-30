/**
 * AUTH — TC-AUTH-01 to TC-AUTH-20
 * Covers: email login, registration, phone OTP, admin login, protected routes, sign out.
 */
import { test, expect } from "@playwright/test";
import { TEST_USER, ADMIN_USER, loginAsUser, loginAsAdmin } from "./helpers/auth";

// ─── Email Login ────────────────────────────────────────────────────────────

test("AUTH-01 email login happy path", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
});

test("AUTH-02 email login wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible();
  await expect(page).toHaveURL(/login/);
});

test("AUTH-03 email login non-existent email shows generic error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("nobody@nowhere.test");
  await page.getByLabel(/password/i).fill("SomePass123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  // Must NOT reveal whether the account exists (no "user not found")
  const errorText = await page.getByRole("alert").or(page.locator("[class*=error],[class*=Error]")).textContent();
  expect(errorText).not.toMatch(/user not found|account doesn't exist/i);
  await expect(page).toHaveURL(/login/);
});

// ─── Registration ────────────────────────────────────────────────────────────

test("AUTH-04 register new user happy path", async ({ page }) => {
  const unique = `test_${Date.now()}@srilaya.test`;
  await page.goto("/register");
  await page.getByLabel(/name/i).fill("New Tester");
  await page.getByLabel(/email/i).fill(unique);
  const pwFields = page.getByLabel(/password/i);
  await pwFields.nth(0).fill("TestPass123!");
  await pwFields.nth(1).fill("TestPass123!");
  await page.getByRole("button", { name: /register|create account/i }).click();
  // Should redirect to home or account
  await expect(page).toHaveURL(/^\/$|account/);
});

test("AUTH-05 register duplicate email shows error", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel(/name/i).fill("Dupe User");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  const pwFields = page.getByLabel(/password/i);
  await pwFields.nth(0).fill("TestPass123!");
  await pwFields.nth(1).fill("TestPass123!");
  await page.getByRole("button", { name: /register|create account/i }).click();
  await expect(page.getByText(/already|exists|in use/i)).toBeVisible();
});

test("AUTH-06 register password mismatch blocked", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel(/name/i).fill("Mismatch User");
  await page.getByLabel(/email/i).fill(`mismatch_${Date.now()}@srilaya.test`);
  const pwFields = page.getByLabel(/password/i);
  await pwFields.nth(0).fill("TestPass123!");
  await pwFields.nth(1).fill("DifferentPass!");
  await page.getByRole("button", { name: /register|create account/i }).click();
  await expect(page.getByText(/match|do not match/i)).toBeVisible();
  await expect(page).toHaveURL(/register/);
});

test("AUTH-07 register weak password blocked", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel(/name/i).fill("Weak Pass");
  await page.getByLabel(/email/i).fill(`weak_${Date.now()}@srilaya.test`);
  const pwFields = page.getByLabel(/password/i);
  await pwFields.nth(0).fill("short");
  await pwFields.nth(1).fill("short");
  await page.getByRole("button", { name: /register|create account/i }).click();
  await expect(page.getByText(/at least 8|minimum|too short/i)).toBeVisible();
});

// ─── Phone OTP ───────────────────────────────────────────────────────────────

test("AUTH-08 phone OTP send — UI shows cooldown", async ({ page }) => {
  await page.goto("/login");
  // Switch to phone tab
  const phoneTab = page.getByRole("tab", { name: /phone|otp/i })
    .or(page.getByText(/phone.*otp|otp.*login/i));
  if (await phoneTab.count() > 0) {
    await phoneTab.click();
  }
  await page.getByLabel(/phone|mobile/i).fill("9876543210");
  await page.getByRole("button", { name: /send otp/i }).click();
  // Expect either success message or cooldown timer
  await expect(
    page.getByText(/otp sent|sent|resend in|cooldown/i)
  ).toBeVisible({ timeout: 5000 });
});

test("AUTH-10 phone OTP wrong code shows error", async ({ page }) => {
  await page.goto("/login");
  const phoneTab = page.getByRole("tab", { name: /phone|otp/i })
    .or(page.getByText(/phone.*otp/i));
  if (await phoneTab.count() > 0) await phoneTab.click();

  await page.getByLabel(/phone|mobile/i).fill("9876543210");
  await page.getByRole("button", { name: /send otp/i }).click();
  await page.waitForTimeout(1000);

  await page.getByLabel(/otp|code/i).fill("000000");
  await page.getByRole("button", { name: /verify|confirm/i }).click();
  await expect(page.getByText(/invalid|incorrect|wrong|expired/i)).toBeVisible();
});

test("AUTH-13 phone OTP invalid phone number blocked", async ({ page }) => {
  await page.goto("/login");
  const phoneTab = page.getByRole("tab", { name: /phone|otp/i })
    .or(page.getByText(/phone.*otp/i));
  if (await phoneTab.count() > 0) await phoneTab.click();

  await page.getByLabel(/phone|mobile/i).fill("12345"); // too short
  await page.getByRole("button", { name: /send otp/i }).click();
  await expect(page.getByText(/valid|invalid|10.digit|format/i)).toBeVisible();
});

// ─── Admin Login ─────────────────────────────────────────────────────────────

test("AUTH-14 admin login happy path", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_USER.email);
  await page.getByLabel(/password/i).fill(ADMIN_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

test("AUTH-15 customer account cannot access admin", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login|login/);
});

// ─── Protected Routes ────────────────────────────────────────────────────────

test("AUTH-16 unauthenticated cannot access /account", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/login/);
});

test("AUTH-17 unauthenticated cannot access /admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
});

// ─── Sign Out ─────────────────────────────────────────────────────────────────

test("AUTH-18 sign out clears session", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/account");
  await page.getByRole("button", { name: /sign out/i }).click();
  // Should be logged out — protected page redirects to login
  await page.goto("/account");
  await expect(page).toHaveURL(/login/);
});
