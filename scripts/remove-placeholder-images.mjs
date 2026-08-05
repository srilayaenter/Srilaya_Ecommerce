/**
 * Nulls out Product.image / ProductImage.url wherever it's an Unsplash
 * stock-photo placeholder, so the site falls back to the honest
 * "photo coming soon" placehold.co box instead of a misleading fake photo.
 * Safe to re-run — only touches rows that still match.
 * Run: node scripts/remove-placeholder-images.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { image: { contains: "unsplash.com" } },
    select: { id: true, title: true, slug: true, image: true },
    orderBy: { title: "asc" },
  });

  const galleryImages = await prisma.productImage.findMany({
    where: { url: { contains: "unsplash.com" } },
    select: { id: true, productId: true, url: true },
  });

  console.log(`\nFound ${products.length} product(s) with an Unsplash placeholder image.`);
  console.log(`Found ${galleryImages.length} gallery image row(s) with an Unsplash placeholder.\n`);

  for (const p of products) {
    console.log(`  ${p.title} (${p.slug})\n    ${p.image}`);
    await prisma.product.update({ where: { id: p.id }, data: { image: null } });
  }

  for (const g of galleryImages) {
    console.log(`  [gallery row ${g.id}] product ${g.productId}\n    ${g.url}`);
    await prisma.productImage.delete({ where: { id: g.id } });
  }

  console.log(`\nCleared ${products.length} product image(s), removed ${galleryImages.length} gallery image row(s).`);
  console.log(`These now fall back to the branded "photo coming soon" placeholder.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
