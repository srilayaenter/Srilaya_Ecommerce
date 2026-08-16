import { Page, Dialog } from "@playwright/test";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set — check your .env.test or .env.test.local`);
  return value;
}

export const TEST_USER = {
  email: requireEnv("TEST_USER_EMAIL"),
  password: requireEnv("TEST_USER_PASSWORD"),
  name: "Test User",
};

export const ADMIN_USER = {
  email: requireEnv("TEST_ADMIN_EMAIL"),
  password: requireEnv("TEST_ADMIN_PASSWORD"),
};

export const OWNER_USER = {
  email: requireEnv("TEST_OWNER_EMAIL"),
  password: requireEnv("TEST_OWNER_PASSWORD"),
};

export async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_USER.email);
  await page.getByLabel(/password/i).fill(ADMIN_USER.password);
  const dismissAlert: (d: Dialog) => void = (d) => d.dismiss();
  page.once("dialog", dismissAlert);
  await page.getByRole("button", { name: /authorize|sign in/i }).click();
  await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });
  page.off("dialog", dismissAlert);
}

export async function loginAsOwner(page: Page) {
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
