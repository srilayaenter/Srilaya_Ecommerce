/**
 * Creates a product on a target DB (e.g. staging) by copying it from local,
 * matching category by name. For products created locally that don't exist
 * on the target yet — sync-image-fields-to-staging.mjs can only update
 * existing rows, not create new ones.
 * Usage: node scripts/create-product-on-staging.mjs <slug>
 * Requires TARGET_DATABASE_URL env var.
 */
import { PrismaClient } from "@prisma/client";

const slug = process.argv[2];
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!slug) {
  console.error("Usage: node scripts/create-product-on-staging.mjs <slug>");
  process.exit(1);
}
if (!targetUrl) {
  console.error('Set TARGET_DATABASE_URL first, e.g.:\n  $env:TARGET_DATABASE_URL = "postgresql://...staging..."');
  process.exit(1);
}

const local = new PrismaClient();
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

async function main() {
  const product = await local.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product) {
    console.error(`No local product with slug "${slug}"`);
    process.exit(1);
  }

  const existing = await target.product.findUnique({ where: { slug } });
  if (existing) {
    console.log(`"${product.title}" already exists on target DB — nothing to do.`);
    return;
  }

  let targetCategory = await target.category.findUnique({ where: { slug: product.category.slug } });
  if (!targetCategory) {
    console.error(`Category "${product.category.name}" (slug: ${product.category.slug}) doesn't exist on target DB. Create it there first.`);
    process.exit(1);
  }

  const created = await target.product.create({
    data: {
      title: product.title,
      slug: product.slug,
      description: product.description,
      currency: product.currency,
      gstRate: product.gstRate,
      sku: product.sku,
      active: product.active,
      image: product.image,
      categoryId: targetCategory.id,
    },
  });
  console.log(`Created "${created.title}" (${created.slug}) on target DB — active: ${created.active}`);
  console.log(`Image: ${created.image ?? "(none)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await local.$disconnect();
    await target.$disconnect();
  });
