import { Page, Dialog } from "@playwright/test";

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
  email: process.env.TEST_OWNER_EMAIL || "avrsrikanth@gmail.com",
  password: process.env.TEST_OWNER_PASSWORD || "RaSa@1500",
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
  // Dismiss any error alert from wrong creds, then remove so it doesn't leak into later tests
  const dismissAlert: (d: Dialog) => void = (d) => d.dismiss();
  page.once("dialog", dismissAlert);
  await page.getByRole("button", { name: /authorize|sign in/i }).click();
  await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });
  page.off("dialog", dismissAlert);
}

export async function loginAsOwner(page: Page) {
  if (!OWNER_USER.email || !OWNER_USER.password) {
    throw new Error("TEST_OWNER_EMAIL / TEST_OWNER_PASSWORD are not set — see .env.test");
  }
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(OWNER_USER.email);
  await page.getByLabel(/password/i).fill(OWNER_USER.password);
  const dismissAlert: (d: Dialog) => void = (d) => d.dismiss();
  page.once("dialog", dismissAlert);
  await page.getByRole("button", { name: /authorize|sign in/i }).click();
  await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });
  page.off("dialog", dismissAlert);
}

export async function logout(page: Page) {
  await page.goto("/account");
  const signOut = page.getByRole("button", { name: /sign out/i });
  if (await signOut.isVisible()) await signOut.click();
}
