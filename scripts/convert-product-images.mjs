/**
 * Convert all PNGs in public/Products/ to WebP at quality 82.
 * Originals are kept as .png.bak for safety — delete them after verifying.
 * Run: node scripts/convert-product-images.mjs
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";

const DIR = new URL("../apps/web/public/Products/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

const files = fs.readdirSync(DIR).filter(f => f.endsWith(".png"));

console.log(`\nConverting ${files.length} PNGs to WebP (quality 82)...\n`);

let totalBefore = 0;
let totalAfter  = 0;

for (const file of files) {
  const pngPath  = path.join(DIR, file);
  const webpName = file.replace(/\.png$/i, ".webp");
  const webpPath = path.join(DIR, webpName);

  const sizeBefore = fs.statSync(pngPath).size;

  await sharp(pngPath)
    .webp({ quality: 82 })
    .toFile(webpPath);

  const sizeAfter = fs.statSync(webpPath).size;
  totalBefore += sizeBefore;
  totalAfter  += sizeAfter;

  const saved = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);
  console.log(`  ✓ ${file.padEnd(40)} ${(sizeBefore/1024).toFixed(0).padStart(5)} KB → ${(sizeAfter/1024).toFixed(0).padStart(4)} KB  (-${saved}%)`);
}

console.log(`\n${"─".repeat(65)}`);
console.log(`  Total before : ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Total after  : ${(totalAfter  / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Saved        : ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(1)} MB  (${(((totalBefore-totalAfter)/totalBefore)*100).toFixed(1)}%)`);
console.log(`\nDone. Original PNGs still present — delete them after verifying the site looks correct.\n`);
