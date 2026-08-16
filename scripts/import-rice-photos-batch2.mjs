/**
 * Converts the 3 newly uploaded rice/flakes photos into square WebP files
 * named per the {slug}.webp convention, auto-correcting EXIF rotation, and
 * sets Product.image to the local path so migrate-images-to-supabase.mjs
 * can pick them up next.
 * Run: node scripts/import-rice-photos-batch2.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = "C:\\Users\\HP\\AppData\\Local\\Temp\\claude\\D--CompanyWebsite-srilaya-ecommerce\\584ac44b-31fe-4f3e-b946-2d987fd317f0\\scratchpad\\photos-upload";
const DEST_DIR = path.join(__dirname, "..", "apps", "web", "public", "Products");
const prisma = new PrismaClient();

const mapping = [
  { src: "20260806_143107.jpg", slug: "rajamudhi-rice" },
  { src: "20260806_142952.jpg", slug: "mapillai-samba-flakes" },
  { src: "20260806_142729.jpg", slug: "karupu-kavuni-rice-tr" },
];

async function main() {
  for (const { src, slug } of mapping) {
    const srcPath = path.join(SRC_DIR, src);
    const destName = `${slug}.webp`;
    const destPath = path.join(DEST_DIR, destName);

    const sizeBefore = fs.statSync(srcPath).size;
    await sharp(srcPath)
      .rotate() // auto-orient using EXIF, then strips it
      .resize(1024, 1024, { fit: "cover", position: "centre", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(destPath + ".tmp");
    fs.renameSync(destPath + ".tmp", destPath);
    const sizeAfter = fs.statSync(destPath).size;

    await prisma.product.updateMany({
      where: { slug },
      data: { image: `/Products/${destName}` },
    });

    const saved = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);
    console.log(`${src.padEnd(24)} ${(sizeBefore / 1024).toFixed(0).padStart(5)} KB -> ${destName.padEnd(28)} ${(sizeAfter / 1024).toFixed(0).padStart(3)} KB (-${saved}%)`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
