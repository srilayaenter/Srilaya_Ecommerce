/**
 * Environment comparison script — storefront pages
 * Visits each page on local dev + staging, captures screenshots + content,
 * then writes an HTML report to scripts/compare-report/index.html
 *
 * Usage:  npx tsx scripts/compare-envs.mts
 */

import { chromium, type Page, type Browser } from "@playwright/test";
import fs from "fs";
import path from "path";

const LOCAL  = "http://localhost:3000";
const STAGING = "https://srilaya-ecommerce-git-staging-avrsrikanth-4431s-projects.vercel.app";
const BYPASS  = "WvXSpSYQ0mnwHssHUHPbLXKrSG5kngpK";

const REPORT_DIR = path.join("scripts", "compare-report");
const SS_DIR     = path.join(REPORT_DIR, "screenshots");

// All storefront routes to compare
const ROUTES: { label: string; path: string; needsProduct?: boolean }[] = [
  { label: "Home",              path: "/" },
  { label: "All Products",      path: "/product" },
  { label: "Bundle Packs",      path: "/bundles" },
  { label: "About Us",          path: "/about" },
  { label: "Contact Us",        path: "/contact" },
  { label: "Blog",              path: "/blog" },
  { label: "Recipes",           path: "/recipes" },
  { label: "Search (millet)",   path: "/product?q=millet" },
  { label: "Cart",              path: "/cart" },
  { label: "Checkout",          path: "/checkout" },
  { label: "Track Order",       path: "/track" },
  { label: "Login",             path: "/login" },
  { label: "Referral",          path: "/referral" },
  { label: "Privacy Policy",    path: "/privacy" },
  { label: "Terms",             path: "/terms" },
  { label: "Shipping Policy",   path: "/shipping-policy" },
  { label: "Returns Policy",    path: "/returns-policy" },
  // Category pages
  { label: "Cat: Flakes",       path: "/category/millet-flakes" },
  { label: "Cat: Flour",        path: "/category/millet-flour" },
  { label: "Cat: Rice",         path: "/category/millet-rice" },
  { label: "Cat: Rava",         path: "/category/millet-rava" },
  { label: "Cat: Laddu",        path: "/category/laddu" },
  { label: "Cat: Sweeteners",   path: "/category/sweeteners" },
  { label: "Cat: Muesli",       path: "/category/muesli-and-granola" },
  { label: "Cat: Parboiled",    path: "/category/millet-parboiled" },
  { label: "Cat: Trad. Rice",   path: "/category/traditional-rice" },
  { label: "Cat: Malt Mixes",   path: "/category/malt-and-health-mixes" },
];

interface PageResult {
  url:          string;
  status:       number | null;
  title:        string;
  h1:           string[];
  h2:           string[];
  productCount: number;
  imageCount:   number;
  brokenImages: string[];
  errorBanners: string[];
  missingText:  string[];   // key phrases expected on the page
  screenshot:   string;     // relative path
  loadMs:       number;
}

interface RouteComparison {
  label:   string;
  path:    string;
  local:   PageResult;
  staging: PageResult;
  diffs:   string[];
}

async function capturePage(
  browser: Browser,
  baseUrl: string,
  route: { label: string; path: string },
  env: "local" | "staging",
  idx: number,
): Promise<PageResult> {
  const ctx = await browser.newContext({
    extraHTTPHeaders: env === "staging"
      ? { "x-vercel-protection-bypass": BYPASS }
      : {},
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();

  const url = `${baseUrl}${route.path}`;
  const ssName = `${String(idx).padStart(2,"0")}_${env}_${route.label.replace(/[^a-z0-9]/gi,"_").toLowerCase()}.png`;
  const ssPath = path.join(SS_DIR, ssName);

  let status: number | null = null;
  const t0 = Date.now();

  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    status = resp?.status() ?? null;
    // Let dynamic content settle
    await page.waitForTimeout(2500);
  } catch (e) {
    await ctx.close();
    return {
      url, status: null,
      title: "TIMEOUT/ERROR",
      h1: [], h2: [],
      productCount: 0, imageCount: 0,
      brokenImages: [], errorBanners: [],
      missingText: [],
      screenshot: ssName,
      loadMs: Date.now() - t0,
    };
  }

  const loadMs = Date.now() - t0;

  // Take full-page screenshot
  await page.screenshot({ path: ssPath, fullPage: false }).catch(() => {});

  // Extract content
  const title  = await page.title().catch(() => "");
  const h1     = await page.$$eval("h1", els => els.map(e => e.textContent?.trim() ?? "")).catch(() => [] as string[]);
  const h2     = await page.$$eval("h2", els => els.map(e => e.textContent?.trim() ?? "")).catch(() => [] as string[]);

  // Count product cards
  const productCount = await page.$$eval(
    "a[href^='/product/']",
    els => new Set(els.map(e => e.getAttribute("href"))).size
  ).catch(() => 0);

  // Count images
  const imageCount = await page.$$eval("img", els => els.length).catch(() => 0);

  // Broken images (naturalWidth === 0 after load)
  const brokenImages = await page.$$eval("img", els =>
    els.filter(img => (img as HTMLImageElement).naturalWidth === 0)
       .map(img => img.getAttribute("src") ?? "unknown")
       .slice(0, 5)
  ).catch(() => [] as string[]);

  // Error banners
  const errorBanners = await page.$$eval(
    "[class*='error'],[class*='Error'],[role='alert']",
    els => els.map(e => e.textContent?.trim().substring(0, 100) ?? "").filter(Boolean)
  ).catch(() => [] as string[]);

  await ctx.close();

  return {
    url, status, title, h1, h2,
    productCount, imageCount, brokenImages, errorBanners,
    missingText: [],
    screenshot: ssName,
    loadMs,
  };
}

function diffResults(local: PageResult, staging: PageResult): string[] {
  const diffs: string[] = [];

  if (local.status !== staging.status)
    diffs.push(`HTTP status: local=${local.status} staging=${staging.status}`);

  if (local.productCount !== staging.productCount)
    diffs.push(`Product cards: local=${local.productCount} staging=${staging.productCount}`);

  if (Math.abs(local.imageCount - staging.imageCount) > 3)
    diffs.push(`Images: local=${local.imageCount} staging=${staging.imageCount}`);

  if (staging.brokenImages.length > local.brokenImages.length)
    diffs.push(`Broken images on staging: ${staging.brokenImages.length} (local: ${local.brokenImages.length})`);

  if (staging.errorBanners.length > 0)
    diffs.push(`Error banners on staging: ${staging.errorBanners.map(e => `"${e}"`).join(", ")}`);

  const localH1  = local.h1.join("|").toLowerCase();
  const stagingH1 = staging.h1.join("|").toLowerCase();
  if (localH1 !== stagingH1 && local.h1.length > 0 && staging.h1.length === 0)
    diffs.push(`H1 missing on staging (local has: "${local.h1[0]}")`);

  if (staging.status === 404 || staging.status === 500)
    diffs.push(`Page error on staging (${staging.status})`);

  if (staging.title === "TIMEOUT/ERROR")
    diffs.push("Page timed out on staging");

  return diffs;
}

function buildHTML(comparisons: RouteComparison[]): string {
  const rows = comparisons.map(c => {
    const hasIssues = c.diffs.length > 0;
    const diffHtml = c.diffs.length
      ? `<ul>${c.diffs.map(d => `<li>${d}</li>`).join("")}</ul>`
      : `<span class="ok">✓ No differences detected</span>`;

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
          <b>Products:</b> ${c.local.productCount} &nbsp;
          <b>Images:</b> ${c.local.imageCount}<br>
          ${c.local.h1.length ? `<b>H1:</b> ${c.local.h1[0]}` : ""}
        </div>
      </div>
      <div class="env-block">
        <div class="env-label staging-label">STAGING</div>
        <img src="screenshots/${c.staging.screenshot}" class="ss" onerror="this.style.display='none'">
        <div class="meta">
          <b>Status:</b> ${c.staging.status ?? "ERR"} &nbsp;
          <b>Load:</b> ${c.staging.loadMs}ms &nbsp;
          <b>Products:</b> ${c.staging.productCount} &nbsp;
          <b>Images:</b> ${c.staging.imageCount}<br>
          ${c.staging.h1.length ? `<b>H1:</b> ${c.staging.h1[0]}` : ""}
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
<title>SriLaYa — Dev vs Staging Comparison</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; font-size: 13px; background: #f5f5f5; color: #222; }
  header { background: #1a3a1a; color: #fff; padding: 20px 32px; }
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
  td.label { width: 160px; font-weight: 600; font-size: 12px; color: #444; white-space: nowrap; }
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
  <h1>SriLaYa Naturals — Dev vs Staging Comparison</h1>
  <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Local: ${LOCAL} &nbsp;|&nbsp; Staging: ${STAGING}</p>
</header>
<div class="summary">
  <div>
    <div class="stat ${issueCount > 0 ? "red" : "green"}">${issueCount}</div>
    <div class="stat-label">Pages with differences</div>
  </div>
  <div>
    <div class="stat">${comparisons.length}</div>
    <div class="stat-label">Pages compared</div>
  </div>
  <div>
    <div class="stat green">${comparisons.length - issueCount}</div>
    <div class="stat-label">Pages matching</div>
  </div>
</div>
<table>
  <thead>
    <tr style="background:#f0f0f0">
      <th style="padding:8px 16px;text-align:left">Page</th>
      <th style="padding:8px 16px;text-align:left">Local vs Staging</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
</body>
</html>`;
}

async function main() {
  fs.mkdirSync(SS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const comparisons: RouteComparison[] = [];

  console.log(`Comparing ${ROUTES.length} pages across local and staging...\n`);

  for (let i = 0; i < ROUTES.length; i++) {
    const route = ROUTES[i];
    process.stdout.write(`[${i+1}/${ROUTES.length}] ${route.label}... `);

    const [local, staging] = await Promise.all([
      capturePage(browser, LOCAL,   route, "local",   i),
      capturePage(browser, STAGING, route, "staging", i),
    ]);

    const diffs = diffResults(local, staging);
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
