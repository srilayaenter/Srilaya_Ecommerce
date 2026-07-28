/**
 * Admin environment comparison script
 * Logs in on local dev + staging, visits all admin pages, compares content,
 * writes HTML report to scripts/compare-admin-report/index.html
 *
 * Usage:  npx tsx scripts/compare-admin.mts
 */

import { chromium, type Page, type Browser, type BrowserContext } from "@playwright/test";
import fs from "fs";
import path from "path";

const LOCAL   = "http://localhost:3000";
const STAGING = "https://srilaya-ecommerce-git-staging-avrsrikanth-4431s-projects.vercel.app";
const BYPASS  = "WvXSpSYQ0mnwHssHUHPbLXKrSG5kngpK";

// Owner account — has access to all admin pages including owner-only ones
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? "avrsrikanth@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

const REPORT_DIR = path.join("scripts", "compare-admin-report");
const SS_DIR     = path.join(REPORT_DIR, "screenshots");

// Skip dynamic/detail pages that need real IDs
const ADMIN_ROUTES: { label: string; path: string; rowSelector?: string; countLabel?: string }[] = [
  { label: "Dashboard",          path: "/admin",                         rowSelector: undefined },
  { label: "Orders",             path: "/admin/orders",                  rowSelector: "table tbody tr", countLabel: "orders" },
  { label: "Orders: New",        path: "/admin/orders/new",              rowSelector: undefined },
  { label: "Products",           path: "/admin/products",                rowSelector: "table tbody tr", countLabel: "products" },
  { label: "Categories",         path: "/admin/categories",              rowSelector: "table tbody tr, li, [class*='category']", countLabel: "categories" },
  { label: "Bundles",            path: "/admin/bundles",                 rowSelector: "table tbody tr, [class*='bundle']", countLabel: "bundles" },
  { label: "Blog",               path: "/admin/blog",                    rowSelector: "table tbody tr", countLabel: "posts" },
  { label: "Customers",          path: "/admin/customers",               rowSelector: "table tbody tr", countLabel: "customers" },
  { label: "Analytics",          path: "/admin/analytics",               rowSelector: undefined },
  { label: "Inventory Import",   path: "/admin/inventory-import",        rowSelector: undefined },
  { label: "Bulk Pricing",       path: "/admin/bulk-pricing",            rowSelector: "table tbody tr", countLabel: "rules" },
  { label: "Coupons",            path: "/admin/coupons",                 rowSelector: "table tbody tr", countLabel: "coupons" },
  { label: "Loyalty",            path: "/admin/loyalty",                 rowSelector: undefined },
  { label: "Returns",            path: "/admin/returns",                 rowSelector: "table tbody tr", countLabel: "returns" },
  { label: "Reviews",            path: "/admin/reviews",                 rowSelector: "table tbody tr", countLabel: "reviews" },
  { label: "GST Report",         path: "/admin/gst-report",              rowSelector: undefined },
  { label: "P&L Report",         path: "/admin/reports/pl",              rowSelector: undefined },
  { label: "Stock Log",          path: "/admin/stock-log",               rowSelector: "table tbody tr", countLabel: "entries" },
  { label: "Purchase Orders",    path: "/admin/purchase-orders",         rowSelector: "table tbody tr", countLabel: "POs" },
  { label: "Suppliers",          path: "/admin/suppliers",               rowSelector: "table tbody tr", countLabel: "suppliers" },
  { label: "Raw Materials",      path: "/admin/raw-materials",           rowSelector: "table tbody tr", countLabel: "materials" },
  { label: "RM Recipes",         path: "/admin/raw-materials/recipes",   rowSelector: "table tbody tr", countLabel: "recipes" },
  { label: "RM Import",          path: "/admin/raw-materials/import",    rowSelector: undefined },
  { label: "Production",         path: "/admin/production",              rowSelector: "table tbody tr", countLabel: "batches" },
  { label: "Packaging",          path: "/admin/packaging",               rowSelector: "table tbody tr", countLabel: "items" },
  { label: "Users",              path: "/admin/users",                   rowSelector: "table tbody tr", countLabel: "users" },
  { label: "Settings",           path: "/admin/settings",                rowSelector: undefined },
  { label: "Failed Emails",      path: "/admin/failed-emails",           rowSelector: "table tbody tr", countLabel: "emails" },
];

interface PageResult {
  url:          string;
  status:       number | null;
  title:        string;
  h1:           string[];
  rowCount:     number;
  errorBanners: string[];
  redirectedTo: string | null;
  screenshot:   string;
  loadMs:       number;
}

async function login(ctx: BrowserContext, baseUrl: string, env: string): Promise<boolean> {
  const page = await ctx.newPage();
  try {
    // Navigate to login page, wait for full hydration
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle", timeout: 30000 });

    // Use accessibility-based selectors (same pattern as E2E test helpers)
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);

    // Dismiss any alert dialog (shown on invalid credentials) so it doesn't block
    page.once("dialog", dialog => dialog.dismiss());

    await page.getByRole("button", { name: /authorize|sign in/i }).click();

    // Wait for navigation away from login (client-side Next.js router.push)
    await page.waitForURL(url => !url.href.includes("/login"), { timeout: 25000 });

    const finalUrl = page.url();
    console.log(`  [${env}] Post-login URL: ${finalUrl}`);

    if (finalUrl.includes("/login") || finalUrl.includes("/mfa-verify")) {
      console.log(`  [${env}] Login failed — still at login/mfa`);
      await page.close();
      return false;
    }

    console.log(`  [${env}] Login successful`);
    await page.close();
    return true;
  } catch (e) {
    const msg = (e as Error).message.split("\n")[0];
    console.log(`  [${env}] Login error: ${msg}`);
    await page.close();
    return false;
  }
}

async function capturePage(
  ctx: BrowserContext,
  baseUrl: string,
  route: typeof ADMIN_ROUTES[number],
  env: "local" | "staging",
  idx: number,
): Promise<PageResult> {
  const page = await ctx.newPage();
  const url  = `${baseUrl}${route.path}`;
  const slug = route.label.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const ssName = `${String(idx).padStart(2, "0")}_${env}_${slug}.png`;
  const ssPath = path.join(SS_DIR, ssName);

  let status: number | null = null;
  let redirectedTo: string | null = null;
  const t0 = Date.now();

  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    status = resp?.status() ?? null;
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    if (!finalUrl.includes(route.path.replace(/\//g, ""))) {
      redirectedTo = finalUrl;
    }
  } catch (e) {
    await page.close();
    return {
      url, status: null, title: "TIMEOUT/ERROR", h1: [],
      rowCount: 0, errorBanners: [], redirectedTo: null,
      screenshot: ssName, loadMs: Date.now() - t0,
    };
  }

  const loadMs = Date.now() - t0;
  await page.screenshot({ path: ssPath, fullPage: false }).catch(() => {});

  const title = await page.title().catch(() => "");
  const h1    = await page.$$eval("h1", els => els.map(e => e.textContent?.trim() ?? "")).catch(() => [] as string[]);

  // Count table rows or list items
  const rowCount = route.rowSelector
    ? await page.$$eval(route.rowSelector, els => els.length).catch(() => 0)
    : 0;

  const errorBanners = await page.$$eval(
    "[class*='error'],[class*='Error'],[role='alert']",
    els => els.map(e => e.textContent?.trim().substring(0, 120) ?? "").filter(Boolean)
  ).catch(() => [] as string[]);

  await page.close();

  return { url, status, title, h1, rowCount, errorBanners, redirectedTo, screenshot: ssName, loadMs };
}

function diffResults(
  route: typeof ADMIN_ROUTES[number],
  local: PageResult,
  staging: PageResult,
): string[] {
  const diffs: string[] = [];

  if (local.status !== staging.status)
    diffs.push(`HTTP status: local=${local.status} staging=${staging.status}`);

  if (staging.status === 404 || staging.status === 500)
    diffs.push(`Page error on staging (${staging.status})`);

  if (staging.title === "TIMEOUT/ERROR")
    diffs.push("Page timed out on staging");

  // Redirect to login means not authenticated
  const stagingRedirectedToLogin = staging.redirectedTo?.includes("/login");
  const localRedirectedToLogin   = local.redirectedTo?.includes("/login");
  if (stagingRedirectedToLogin && !localRedirectedToLogin)
    diffs.push(`Staging redirected to login (not authenticated)`);
  if (localRedirectedToLogin && !stagingRedirectedToLogin)
    diffs.push(`Local redirected to login but staging did not`);
  if (stagingRedirectedToLogin && localRedirectedToLogin)
    diffs.push(`Both envs redirected to login — auth session not established`);

  if (staging.errorBanners.length > local.errorBanners.length)
    diffs.push(`Error banners on staging: ${staging.errorBanners.map(e => `"${e}"`).join(", ")}`);

  // Row count diff (flag if staging has significantly fewer rows)
  if (route.rowSelector && route.countLabel) {
    const diff = local.rowCount - staging.rowCount;
    if (diff > 2 || (local.rowCount > 0 && staging.rowCount === 0)) {
      diffs.push(`${route.countLabel}: local=${local.rowCount} staging=${staging.rowCount}`);
    }
  }

  // H1 missing on staging
  if (local.h1.length > 0 && staging.h1.length === 0)
    diffs.push(`H1 missing on staging (local: "${local.h1[0]}")`);

  return diffs;
}

function buildHTML(comparisons: { label: string; path: string; local: PageResult; staging: PageResult; diffs: string[] }[]): string {
  const rows = comparisons.map((c, i) => {
    const hasIssues = c.diffs.length > 0;
    const diffHtml = c.diffs.length
      ? `<ul>${c.diffs.map(d => `<li>${d}</li>`).join("")}</ul>`
      : `<span class="ok">✓ No differences detected</span>`;

    const route = ADMIN_ROUTES[i];

    return `
<tr class="${hasIssues ? "has-diff" : "ok-row"}">
  <td class="label">${c.label}<br><code>${c.path}</code></td>
  <td>
    <div class="env-row">
      <div class="env-block">
        <div class="env-label local-label">LOCAL</div>
        <img src="screenshots/${c.local.screenshot}" class="ss" onerror="this.style.display='none'">
        <div class="meta">
          <b>Status:</b> ${c.local.status ?? "ERR"} &nbsp;
          <b>Load:</b> ${c.local.loadMs}ms &nbsp;
          ${route.countLabel ? `<b>${route.countLabel}:</b> ${c.local.rowCount} &nbsp;` : ""}
          <b>H1:</b> ${c.local.h1[0] ?? "—"}
        </div>
      </div>
      <div class="env-block">
        <div class="env-label staging-label">STAGING</div>
        <img src="screenshots/${c.staging.screenshot}" class="ss" onerror="this.style.display='none'">
        <div class="meta">
          <b>Status:</b> ${c.staging.status ?? "ERR"} &nbsp;
          <b>Load:</b> ${c.staging.loadMs}ms &nbsp;
          ${route.countLabel ? `<b>${route.countLabel}:</b> ${c.staging.rowCount} &nbsp;` : ""}
          <b>H1:</b> ${c.staging.h1[0] ?? "—"}
          ${c.staging.redirectedTo ? `<br><b>⚠ Redirected to:</b> ${c.staging.redirectedTo}` : ""}
        </div>
      </div>
    </div>
    <div class="diffs">${diffHtml}</div>
  </td>
</tr>`;
  }).join("\n");

  const issueCount = comparisons.filter(c => c.diffs.length > 0).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SriLaYa — Admin Dev vs Staging</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; font-size: 13px; background: #f5f5f5; color: #222; }
  header { background: #1a1a3a; color: #fff; padding: 20px 32px; }
  header h1 { font-size: 20px; }
  header p  { color: #aaa; margin-top: 4px; font-size: 12px; }
  .summary { background: #fff; padding: 16px 32px; border-bottom: 1px solid #ddd; display: flex; gap: 32px; }
  .stat { font-size: 24px; font-weight: 700; }
  .stat-label { font-size: 11px; color: #888; }
  .stat.red { color: #c00; }
  .stat.green { color: #090; }
  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #e0e0e0; }
  tr.has-diff { background: #fff8f0; }
  tr.ok-row   { background: #fff; }
  td { padding: 12px 16px; vertical-align: top; }
  td.label { width: 180px; font-weight: 600; font-size: 12px; color: #444; white-space: nowrap; }
  td.label code { font-size: 10px; color: #888; font-weight: 400; display: block; margin-top: 2px; }
  .env-row { display: flex; gap: 12px; }
  .env-block { flex: 1; }
  .env-label { font-size: 10px; font-weight: 700; letter-spacing: .08em; padding: 2px 6px; border-radius: 3px; display: inline-block; margin-bottom: 6px; }
  .local-label   { background: #e8f0fe; color: #1a56e8; }
  .staging-label { background: #fef3e8; color: #c06000; }
  .ss { width: 100%; max-width: 580px; border: 1px solid #ddd; border-radius: 4px; display: block; }
  .meta { margin-top: 6px; color: #555; font-size: 11px; line-height: 1.6; }
  .diffs { margin-top: 10px; padding: 8px 12px; background: #fff3cd; border-left: 3px solid #e6a800; border-radius: 2px; font-size: 12px; }
  .diffs ul { padding-left: 16px; }
  .diffs li { margin-top: 3px; }
  .ok { color: #090; font-size: 12px; }
  .ok-row .diffs { background: #e8f5e9; border-left-color: #2e7d32; }
</style>
</head>
<body>
<header>
  <h1>SriLaYa Naturals — Admin Dev vs Staging</h1>
  <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Local: ${LOCAL} &nbsp;|&nbsp; Staging: ${STAGING}</p>
</header>
<div class="summary">
  <div><div class="stat ${issueCount > 0 ? "red" : "green"}">${issueCount}</div><div class="stat-label">Pages with differences</div></div>
  <div><div class="stat">${comparisons.length}</div><div class="stat-label">Pages compared</div></div>
  <div><div class="stat green">${comparisons.length - issueCount}</div><div class="stat-label">Pages matching</div></div>
</div>
<table>
  <thead><tr style="background:#f0f0f0">
    <th style="padding:8px 16px;text-align:left">Page</th>
    <th style="padding:8px 16px;text-align:left">Local vs Staging</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body>
</html>`;
}

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error("ERROR: Set ADMIN_PASSWORD env var before running.\n  ADMIN_PASSWORD=yourpass npx tsx scripts/compare-admin.mts");
    process.exit(1);
  }

  fs.mkdirSync(SS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  // Create persistent contexts (cookies carry auth session)
  const localCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const stagingCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { "x-vercel-protection-bypass": BYPASS },
  });

  console.log("Logging in to both environments...");
  const [localOk, stagingOk] = await Promise.all([
    login(localCtx, LOCAL, "local"),
    login(stagingCtx, STAGING, "staging"),
  ]);

  // Retry once if either login failed
  if (!localOk) {
    console.log("  Retrying local login...");
    localOk = await login(localCtx, LOCAL, "local");
  }
  if (!stagingOk) {
    console.log("  Retrying staging login...");
    stagingOk = await login(stagingCtx, STAGING, "staging");
  }

  if (!localOk || !stagingOk) {
    console.error(`\nERROR: Login failed — local=${localOk} staging=${stagingOk}. Cannot compare without auth on both sides.`);
    await browser.close();
    process.exit(1);
  }

  const comparisons: { label: string; path: string; local: PageResult; staging: PageResult; diffs: string[] }[] = [];

  console.log(`\nComparing ${ADMIN_ROUTES.length} admin pages...\n`);

  for (let i = 0; i < ADMIN_ROUTES.length; i++) {
    const route = ADMIN_ROUTES[i];
    process.stdout.write(`[${i+1}/${ADMIN_ROUTES.length}] ${route.label}... `);

    const [local, staging] = await Promise.all([
      capturePage(localCtx, LOCAL, route, "local", i),
      capturePage(stagingCtx, STAGING, route, "staging", i),
    ]);

    const diffs = diffResults(route, local, staging);
    comparisons.push({ label: route.label, path: route.path, local, staging, diffs });
    console.log(diffs.length > 0 ? `⚠  ${diffs.length} diff(s)` : "✓");
  }

  await browser.close();

  const html = buildHTML(comparisons);
  const reportPath = path.join(REPORT_DIR, "index.html");
  fs.writeFileSync(reportPath, html, "utf-8");

  console.log(`\nReport written to: ${reportPath}`);
  console.log(`Issues found on ${comparisons.filter(c => c.diffs.length > 0).length} of ${comparisons.length} pages.`);
}

main().catch(e => { console.error(e); process.exit(1); });
