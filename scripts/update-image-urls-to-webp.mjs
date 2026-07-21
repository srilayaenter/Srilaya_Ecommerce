/**
 * Updates product image URLs in DB from .png to .webp for /Products/ images.
 * Run: node scripts/update-image-urls-to-webp.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { image: { contains: "/Products/" } },
    select: { id: true, title: true, image: true },
  });

  console.log(`\nFound ${products.length} products with /Products/ images\n`);

  let updated = 0;
  for (const p of products) {
    if (!p.image) continue;
    const newImage = p.image.replace(/\.png$/i, ".webp");
    if (newImage === p.image) continue;

    await prisma.product.update({ where: { id: p.id }, data: { image: newImage } });
    console.log(`  ✓ ${p.title}`);
    console.log(`    ${p.image}`);
    console.log(`    → ${newImage}\n`);
    updated++;
  }

  console.log(`Updated ${updated} product image URLs.\n`);
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
