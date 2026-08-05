/**
 * Converts real flakes product photos from /Images into square WebP files
 * matching the site's existing /Products/ convention, and reports before/after size.
 * Run: node scripts/import-flakes-photos.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, "..", "Images");
const DEST_DIR = path.join(__dirname, "..", "apps", "web", "public", "Products");

// source filename -> destination filename (matches existing DB image paths)
const mapping = {
  "Barley_Flakes.jpeg": "Barley-Flakes.webp",
  "Baryard_Flakes.jpeg": "Barnyard-Flakes.webp",
  "KaruppuKavuni_Flakes.jpeg": "Karupukavuni-Flakes.webp",
  "Kodo_Flakes.jpeg": "Kodo-Flakes.webp",
  "MaapillaiSamba_Flakes.jpeg": "MapillaiSambha-Flakes.webp",
  "RedShorgum_Flakes.jpeg": "RedSorghum-Flakes.webp",
  "Wheat_Flakes.jpeg": "Wheat-Flakes.webp",
  "WhiteSorghum_Flakes.jpeg": "WhiteSorghum-Flakes.webp",
};

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;

  for (const [src, dest] of Object.entries(mapping)) {
    const srcPath = path.join(SRC_DIR, src);
    const destPath = path.join(DEST_DIR, dest);

    const sizeBefore = fs.statSync(srcPath).size;

    await sharp(srcPath)
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toFile(destPath + ".tmp");

    fs.renameSync(destPath + ".tmp", destPath);

    const sizeAfter = fs.statSync(destPath).size;
    totalBefore += sizeBefore;
    totalAfter += sizeAfter;

    const saved = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);
    console.log(
      `${src.padEnd(28)} ${(sizeBefore / 1024).toFixed(0).padStart(4)} KB -> ${dest.padEnd(28)} ${(sizeAfter / 1024).toFixed(0).padStart(3)} KB (-${saved}%)`
    );
  }

  console.log(`\nTotal: ${(totalBefore / 1024).toFixed(0)} KB -> ${(totalAfter / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
