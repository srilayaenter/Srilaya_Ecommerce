import sharp from "sharp";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const src = "C:\\Users\\HP\\Downloads\\20260806_150910.jpg";
  const slug = "barnyard-parboiled-rice";
  const destName = `${slug}.webp`;
  const destPath = `apps/web/public/Products/${destName}`;

  const before = fs.statSync(src).size;
  await sharp(src)
    .rotate()
    .resize(1024, 1024, { fit: "cover", position: "centre", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destPath + ".tmp");
  fs.renameSync(destPath + ".tmp", destPath);
  const after = fs.statSync(destPath).size;

  await prisma.product.updateMany({ where: { slug }, data: { image: `/Products/${destName}` } });

  console.log(`Barnyard Parboiled Rice: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
