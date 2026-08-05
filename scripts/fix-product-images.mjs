/**
 * Assigns real product photos from apps/web/public/Products/ to matching
 * products by title, using only .webp filenames that actually exist on disk.
 * Idempotent — safe to re-run. Reports products left without a match.
 * Run: node scripts/fix-product-images.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, "..", "apps", "web", "public", "Products");

const prisma = new PrismaClient();

// title -> filename (must exist in PRODUCTS_DIR)
const mapping = {
  "Foxtail Rice": "Foxtail-Millet.webp",
  "Ragi Rice": "Ragi-Millet.webp",
  "Barnyard Rice": "Barnyard-millet.webp",
  "Kodo Rice": "kodo-Millet.webp",
  "Little Rice": "Little-Millet.webp",
  "Pearl Rice": "NativePearl-Millet.webp",
  "White Sorghum Rice": "WhiteSorghum-millet.webp",
  "Browntop Rice": "Browntop-Millet.webp",
  "Red Sorghum Rice": "RedSorghum-Millet.webp",
  "Proso Rice": "Proso-Millet.webp",
  "Foxtail Flakes": "Foxtail-Flakes.webp",
  "Ragi Flakes": "RagiMillet-Flakes.webp",
  "Barnyard Flakes": "Barnyard-Flakes.webp",
  "Kodo Flakes": "Kodo-Flakes.webp",
  "White Sorghum Flakes": "WhiteSorghum-Flakes.webp",
  "Barley Flakes": "Barley-Flakes.webp",
  "Pearl Flakes": "Pearl-Flakes.webp",
  "Greengram Flakes": "Greengram-Flakes.webp",
  "Horsegram Flakes": "Horsegram-Flakes.webp",
  "Red Sorghum Flakes": "RedSorghum-Flakes.webp",
  "Wheat Flakes": "Wheat-Flakes.webp",
  "Mapillai Samba Flakes": "MapillaiSambha-Flakes.webp",
  "Karupu Kavuni Rice Flakes": "Karupukavini Rice Flakes.webp",
};

async function main() {
  const diskFiles = new Set(fs.readdirSync(PRODUCTS_DIR));

  let updated = 0;
  const missingFile = [];
  const noProductMatch = [];

  for (const [title, filename] of Object.entries(mapping)) {
    if (!diskFiles.has(filename)) {
      missingFile.push(`${title} -> ${filename}`);
      continue;
    }

    const encoded = filename
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const imagePath = `/Products/${encoded}`;

    const result = await prisma.product.updateMany({
      where: { title },
      data: { image: imagePath },
    });

    if (result.count > 0) {
      console.log(`OK  ${title} -> ${imagePath}`);
      updated += result.count;
    } else {
      noProductMatch.push(title);
    }
  }

  console.log(`\nUpdated ${updated} product(s).`);
  if (missingFile.length) {
    console.log(`\nSkipped (no file on disk):`);
    missingFile.forEach((m) => console.log(`  - ${m}`));
  }
  if (noProductMatch.length) {
    console.log(`\nNo product row matched this title:`);
    noProductMatch.forEach((t) => console.log(`  - ${t}`));
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
