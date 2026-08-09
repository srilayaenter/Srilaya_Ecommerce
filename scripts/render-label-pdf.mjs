#!/usr/bin/env node
// Renders label-print-source.html files to PDF using Playwright's Chromium,
// respecting each file's own @page CSS size (no --user-data-dir needed —
// Playwright's default context is ephemeral and cleans itself up on close,
// unlike a manually driven headless Edge profile pinned to a named folder).
import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2 || args.length % 2 !== 0) {
    console.error(
      "Usage: node scripts/render-label-pdf.mjs <input1.html> <output1.pdf> [<input2.html> <output2.pdf> ...]"
    );
    process.exit(1);
  }

  const browser = await chromium.launch();
  try {
    for (let i = 0; i < args.length; i += 2) {
      const inputHtml = path.resolve(args[i]);
      const outputPdf = path.resolve(args[i + 1]);
      const page = await browser.newPage();
      await page.goto(pathToFileURL(inputHtml).href);
      await page.pdf({ path: outputPdf, printBackground: true, preferCSSPageSize: true });
      await page.close();
      console.log(`Rendered ${outputPdf}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
