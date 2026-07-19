import { Page } from "@playwright/test";

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "avrsrikanth@gmail.com",
  password: process.env.TEST_USER_PASSWORD || "RaSa@1500",
  name: "Test User",
};

export const ADMIN_USER = {
  email: process.env.TEST_ADMIN_EMAIL || "admin@srilayafoods.com",
  password: process.env.TEST_ADMIN_PASSWORD || "admin123",
};

export const OWNER_USER = {
  email: process.env.TEST_OWNER_EMAIL || "",
  password: process.env.TEST_OWNER_PASSWORD || "",
};

export async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Accept any successful redirect away from login (owner may go to /account or /)
  await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_USER.email);
  await page.getByLabel(/password/i).fill(ADMIN_USER.password);
  // Handle potential error alert (wrong creds) so it doesn't block
  page.once("dialog", dialog => dialog.dismiss());
  // Button text is "Authorize Access" on admin login
  await page.getByRole("button", { name: /authorize|sign in/i }).click();
  // Wait for redirect away from the login page (not /admin/login) — generous timeout for dev server
  await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });
}

export async function loginAsOwner(page: Page) {
  if (!OWNER_USER.email || !OWNER_USER.password) {
    throw new Error("TEST_OWNER_EMAIL / TEST_OWNER_PASSWORD are not set — see .env.test");
  }
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(OWNER_USER.email);
  await page.getByLabel(/password/i).fill(OWNER_USER.password);
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: /authorize|sign in/i }).click();
  await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });
}

export async function logout(page: Page) {
  await page.goto("/account");
  const signOut = page.getByRole("button", { name: /sign out/i });
  if (await signOut.isVisible()) await signOut.click();
}
