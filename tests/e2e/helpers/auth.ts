import { Page } from "@playwright/test";

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "testuser@srilaya.test",
  password: process.env.TEST_USER_PASSWORD || "TestPass123!",
  name: "Test User",
};

export const ADMIN_USER = {
  email: process.env.TEST_ADMIN_EMAIL || "admin@srilaya.test",
  password: process.env.TEST_ADMIN_PASSWORD || "AdminPass123!",
};

export async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/");
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_USER.email);
  await page.getByLabel(/password/i).fill(ADMIN_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/admin");
}

export async function logout(page: Page) {
  await page.goto("/account");
  const signOut = page.getByRole("button", { name: /sign out/i });
  if (await signOut.isVisible()) await signOut.click();
}
