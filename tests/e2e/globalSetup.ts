import { request } from "@playwright/test";
import path from "path";
import fs from "fs";

const STORAGE_STATE_PATH = path.join(__dirname, ".auth", "bypass.json");

export default async function globalSetup() {
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const baseURL = process.env.TEST_BASE_URL;

  if (!bypassSecret || !baseURL) return;

  // Hit the base URL with the bypass header so Vercel sets the protection cookie.
  // That cookie is then stored and reused by every browser context in the suite.
  const ctx = await request.newContext({ baseURL });
  await ctx.get("/", {
    headers: { "x-vercel-protection-bypass": bypassSecret },
  });

  const storageState = await ctx.storageState();
  await ctx.dispose();

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(storageState));
}
