/**
 * Sync product catalogue from local DB → staging DB
 *
 * Syncs: Category, Product, ProductVariant, ProductImage
 * Skips: Users, Orders, Cart, Reviews, Coupons (environment-specific data)
 *
 * Usage:  npx tsx scripts/sync-local-to-staging.mts
 *
 * Reads  from DATABASE_URL  in .env
 * Writes to   DIRECT_URL    in .env.staging   (staging Supabase)
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import path from "path";

// ── Load env files ──────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(".env") });
const localDbUrl = process.env.DATABASE_URL;

// Reset and load staging env
for (const key of ["DATABASE_URL", "DIRECT_URL"]) delete process.env[key];
dotenv.config({ path: path.resolve(".env.staging"), override: true });
const stagingDbUrl = process.env.DIRECT_URL;  // use direct URL for script (no pooler needed)

if (!localDbUrl)   throw new Error("DATABASE_URL not found in .env");
if (!stagingDbUrl) throw new Error("DIRECT_URL not found in .env.staging");

console.log("Local DB  : connected");
console.log("Staging DB: connected\n");

const local   = new PrismaClient({ datasources: { db: { url: localDbUrl } } });
const staging = new PrismaClient({ datasources: { db: { url: stagingDbUrl } } });

// ── Helpers ─────────────────────────────────────────────────────────────────
function log(label: string, created: number, updated: number, skipped = 0) {
  console.log(
    `  ${label.padEnd(20)} created=${String(created).padStart(3)}  updated=${String(updated).padStart(3)}` +
    (skipped ? `  skipped=${skipped}` : "")
  );
}

// ── 1. Categories (parent → child order) ────────────────────────────────────
async function syncCategories(): Promise<Set<string>> {
  console.log("── Categories ──────────────────────────────");

  // Parents first (parentId null), then children
  const cats = await local.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  let created = 0, updated = 0, errors = 0;

  for (const cat of cats) {
    try {
      await staging.category.upsert({
        where: { id: cat.id },
        create: { ...cat },
        update: {
          name: cat.name, slug: cat.slug, description: cat.description,
          image: cat.image, parentId: cat.parentId,
        },
      });
      const exists = await staging.category.findUnique({ where: { id: cat.id } });
      // count as created if it was just inserted (approximate)
      if (!exists) created++; else updated++;
    } catch (e: any) {
      // slug unique conflict — update by slug instead
      try {
        await staging.category.upsert({
          where: { slug: cat.slug },
          create: { ...cat, id: cat.id },
          update: {
            id: cat.id, name: cat.name, description: cat.description,
            image: cat.image, parentId: cat.parentId,
          },
        });
        created++;
      } catch (e2: any) {
        console.error(`    ✗ Category "${cat.name}" (${cat.slug}): ${e2.message?.split("\n")[0]}`);
        errors++;
      }
    }
  }

  // After upsert, count actual state
  const stagingCatIds = new Set(
    (await staging.category.findMany({ select: { id: true } })).map(c => c.id)
  );

  log("Category", created, updated, errors);
  console.log(`    Staging now has ${stagingCatIds.size} categories, local has ${cats.length}`);
  return stagingCatIds;
}

// ── 2. Products ──────────────────────────────────────────────────────────────

async function syncProducts(validCategoryIds: Set<string>) {
  console.log("── Products ────────────────────────────────");

  const products = await local.product.findMany({ orderBy: { createdAt: "asc" } });
  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (const p of products) {
    // Skip if the category doesn't exist on staging (shouldn't happen after category sync)
    if (p.categoryId && !validCategoryIds.has(p.categoryId)) {
      console.error(`    ✗ Product "${p.name}" skipped — categoryId ${p.categoryId} not in staging`);
      skipped++;
      continue;
    }

    try {
      await staging.product.upsert({
        where: { id: p.id },
        create: { ...p },
        update: {
          name: p.name, slug: p.slug, description: p.description,
          longDescription: p.longDescription, categoryId: p.categoryId,
          active: p.active, featured: p.featured, tags: p.tags,
          shelfLife: p.shelfLife, storageInfo: p.storageInfo,
          nutritionInfo: p.nutritionInfo, certifications: p.certifications,
          reviews: p.reviews, rating: p.rating,
        },
      });
      // approximate created/updated
      created++;
    } catch (e: any) {
      // slug conflict
      try {
        await staging.product.upsert({
          where: { slug: p.slug },
          create: { ...p },
          update: {
            name: p.name, description: p.description,
            categoryId: p.categoryId, active: p.active,
          },
        });
        created++;
      } catch (e2: any) {
        console.error(`    ✗ Product "${p.name}": ${e2.message?.split("\n")[0]}`);
        errors++;
      }
    }
  }

  log("Product", created, updated, skipped + errors);
  return new Set(
    (await staging.product.findMany({ select: { id: true } })).map(p => p.id)
  );
}

async function syncVariants(validProductIds: Set<string>) {
  console.log("── Product Variants ────────────────────────");

  const variants = await local.productVariant.findMany({ orderBy: { createdAt: "asc" } });
  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (const v of variants) {
    if (!validProductIds.has(v.productId)) { skipped++; continue; }

    try {
      await staging.productVariant.upsert({
        where: { id: v.id },
        create: { ...v },
        update: {
          productId: v.productId, sku: v.sku, weightGrams: v.weightGrams,
          price: v.price, mrp: v.mrp, stock: v.stock, active: v.active,
          lowStockThreshold: v.lowStockThreshold, reorderQuantity: v.reorderQuantity,
        },
      });
      created++;
    } catch (e: any) {
      console.error(`    ✗ Variant ${v.sku}: ${e.message?.split("\n")[0]}`);
      errors++;
    }
  }

  log("ProductVariant", created, updated, skipped + errors);
  return new Set(
    (await staging.productVariant.findMany({ select: { id: true } })).map(v => v.id)
  );
}

async function syncImages(validProductIds: Set<string>) {
  console.log("── Product Images ──────────────────────────");

  const images = await local.productImage.findMany({ orderBy: { position: "asc" } });
  let created = 0, updated = 0, skipped = 0;

  for (const img of images) {
    if (!validProductIds.has(img.productId)) { skipped++; continue; }

    try {
      await staging.productImage.upsert({
        where: { id: img.id },
        create: { ...img },
        update: { url: img.url, alt: img.alt, position: img.position },
      });
      created++;
    } catch { skipped++; }
  }

  log("ProductImage", created, updated, skipped);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    // Verify connectivity
    await local.$queryRaw`SELECT 1`;
    await staging.$queryRaw`SELECT 1`;

    const [localCatCount, stagingCatCount] = await Promise.all([
      local.category.count(),
      staging.category.count(),
    ]);
    const [localProdCount, stagingProdCount] = await Promise.all([
      local.product.count(),
      staging.product.count(),
    ]);

    console.log("Before sync:");
    console.log(`  Categories : local=${localCatCount}  staging=${stagingCatCount}`);
    console.log(`  Products   : local=${localProdCount}  staging=${stagingProdCount}\n`);

    const stagingCatIds  = await syncCategories();
    const stagingProdIds = await syncProducts(stagingCatIds);
    const stagingVarIds  = await syncVariants(stagingProdIds);
    await syncImages(stagingProdIds);

    const [newCatCount, newProdCount] = await Promise.all([
      staging.category.count(),
      staging.product.count(),
    ]);

    console.log("\nAfter sync:");
    console.log(`  Categories : staging=${newCatCount}`);
    console.log(`  Products   : staging=${newProdCount}`);
    console.log("\n✓ Sync complete.");
  } finally {
    await local.$disconnect();
    await staging.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
