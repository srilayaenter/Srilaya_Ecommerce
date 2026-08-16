/**
 * Converts the 3 laddu source photos already sitting (under non-convention
 * names) in apps/web/public/Products/ into square WebP files named per the
 * {slug}.webp convention, and sets Product.image to the local path so
 * migrate-images-to-supabase.mjs can pick them up next.
 * Run: node scripts/import-laddu-photos.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "apps", "web", "public", "Products");
const prisma = new PrismaClient();

const mapping = [
  { src: "Barnyard Laddu.jpeg", slug: "barnyard-millet-laddu" },
  { src: "Foxtail Laddu.jpeg", slug: "foxtail-millet-laddu" },
  { src: "Groundnut Laddu.jpg", slug: "groundnut-laddu" },
];

async function main() {
  for (const { src, slug } of mapping) {
    const srcPath = path.join(DIR, src);
    const destName = `${slug}.webp`;
    const destPath = path.join(DIR, destName);

    const sizeBefore = fs.statSync(srcPath).size;
    await sharp(srcPath)
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
