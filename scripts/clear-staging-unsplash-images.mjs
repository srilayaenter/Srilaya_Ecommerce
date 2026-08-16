/**
 * Nulls out Product.image / ProductImage.url wherever it's an Unsplash
 * stock-photo placeholder on the TARGET DB (typically staging).
 *
 * This is the staging counterpart to remove-placeholder-images.mjs which
 * only ran against local. Staging still has the stale Unsplash URLs because
 * sync-image-fields-to-staging.mjs only copies non-null images — it never
 * clears rows that local already nulled out.
 *
 * Requires TARGET_DATABASE_URL (the staging connection string).
 *   $env:TARGET_DATABASE_URL = "postgresql://postgres:<password>@db.jymxvcukrcjifnmjeyhc.supabase.co:5432/postgres"
 *
 * Dry run by default:
 *   node scripts/clear-staging-unsplash-images.mjs
 * Apply:
 *   node scripts/clear-staging-unsplash-images.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!targetUrl) {
  console.error("Set TARGET_DATABASE_URL to the staging connection string first, e.g.:");
  console.error('  $env:TARGET_DATABASE_URL = "postgresql://postgres:<password>@db.jymxvcukrcjifnmjeyhc.supabase.co:5432/postgres"');
  console.error("  node scripts/clear-staging-unsplash-images.mjs --apply");
  process.exit(1);
}

const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

async function main() {
  const products = await target.product.findMany({
    where: { image: { contains: "unsplash.com" } },
    select: { id: true, title: true, slug: true, image: true },
    orderBy: { title: "asc" },
  });

  const galleryImages = await target.productImage.findMany({
    where: { url: { contains: "unsplash.com" } },
    select: { id: true, productId: true, url: true },
  });

  console.log(`\nFound ${products.length} product(s) with an Unsplash placeholder image on staging.`);
  console.log(`Found ${galleryImages.length} gallery image row(s) with an Unsplash placeholder on staging.\n`);

  for (const p of products) {
    console.log(`  ${p.title} (${p.slug})\n    ${p.image}`);
    if (APPLY) {
      await target.product.update({ where: { id: p.id }, data: { image: null } });
    }
  }

  for (const g of galleryImages) {
    console.log(`  [gallery row ${g.id}] product ${g.productId}\n    ${g.url}`);
    if (APPLY) {
      await target.productImage.delete({ where: { id: g.id } });
    }
  }

  if (!APPLY && (products.length > 0 || galleryImages.length > 0)) {
    console.log(`\nDry run — re-run with --apply to write these changes to staging.`);
  } else if (APPLY) {
    console.log(`\nCleared ${products.length} product image(s), removed ${galleryImages.length} gallery row(s) from staging.`);
    console.log(`These now fall back to the branded "photo coming soon" placeholder.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => target.$disconnect());
