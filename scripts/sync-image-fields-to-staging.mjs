/**
 * Copies Product.image values from the LOCAL DB (source of truth, already
 * fixed) to a target DB — normally staging — matched by product slug.
 * No file operations, no assumptions about what's on disk: just brings the
 * target DB's image references in line with local's.
 *
 * Requires TARGET_DATABASE_URL (the staging connection string) — leaves
 * DATABASE_URL alone so the local client still points at your local DB.
 *
 * Dry run by default. Run: node scripts/sync-image-fields-to-staging.mjs
 * Apply:                   node scripts/sync-image-fields-to-staging.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!targetUrl) {
  console.error("Set TARGET_DATABASE_URL to the staging connection string first, e.g.:");
  console.error('  $env:TARGET_DATABASE_URL = "postgresql://...staging..."');
  console.error("  node scripts/sync-image-fields-to-staging.mjs");
  process.exit(1);
}

const local = new PrismaClient();
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

async function main() {
  const localProducts = await local.product.findMany({
    where: { image: { not: null } },
    select: { slug: true, title: true, image: true },
  });
  const targetProducts = await target.product.findMany({
    select: { id: true, slug: true, image: true },
  });
  const targetBySlug = new Map(targetProducts.map((p) => [p.slug, p]));

  let updated = 0;
  let alreadyMatched = 0;
  const notFoundOnTarget = [];

  for (const lp of localProducts) {
    const tp = targetBySlug.get(lp.slug);
    if (!tp) {
      notFoundOnTarget.push(lp.slug);
      continue;
    }
    if (tp.image === lp.image) {
      alreadyMatched++;
      continue;
    }
    console.log(`${lp.title} (${lp.slug})\n  staging: ${tp.image ?? "(null)"}\n  ->       ${lp.image}`);
    if (APPLY) {
      await target.product.update({ where: { id: tp.id }, data: { image: lp.image } });
    }
    updated++;
  }

  console.log(`\n${APPLY ? "Updated" : "Would update"} ${updated} product(s) on the target DB.`);
  console.log(`${alreadyMatched} already matched.`);
  if (notFoundOnTarget.length) {
    console.log(`${notFoundOnTarget.length} slug(s) exist locally but not on target: ${notFoundOnTarget.join(", ")}`);
  }
  if (!APPLY && updated > 0) {
    console.log(`\nDry run — re-run with --apply to write these changes.`);
  }
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
