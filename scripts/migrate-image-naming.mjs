/**
 * Renames apps/web/public/Products/ files to the slug-based convention
 * ({slug}.webp for the main image, {slug}-{position}.webp for gallery images)
 * and updates Product.image / ProductImage.url to match.
 *
 * Also reports (but does not act on):
 *  - CONFLICTS: one file currently claimed by more than one product (the
 *    "same picture assigned to two products" bug) — needs a human to supply
 *    the missing real photo, so these are left untouched.
 *  - ORPHANED files: on disk but not referenced by any product/gallery row.
 *  - CONTENT DUPLICATES: byte-identical files under different names, even if
 *    each is correctly assigned to its own product (informational only).
 *
 * Dry run by default — prints the full plan and does not touch disk or DB.
 * Run: node scripts/migrate-image-naming.mjs
 * Apply: node scripts/migrate-image-naming.mjs --apply
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, "..", "apps", "web", "public", "Products");
const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient();

const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const localFilename = (urlPath) => decodeURIComponent(urlPath.replace(/^\/Products\//, ""));

async function main() {
  const diskFiles = fs.readdirSync(PRODUCTS_DIR).filter((f) => fs.statSync(path.join(PRODUCTS_DIR, f)).isFile());

  // ---- content-duplicate report (informational) ----
  const hashes = {};
  for (const f of diskFiles) {
    try {
      hashes[f] = sha256(path.join(PRODUCTS_DIR, f));
    } catch {}
  }
  const byHash = {};
  for (const [f, h] of Object.entries(hashes)) (byHash[h] ??= []).push(f);
  const contentDuplicates = Object.values(byHash).filter((g) => g.length > 1);

  // ---- load DB references ----
  const products = await prisma.product.findMany({
    where: { image: { startsWith: "/Products/" } },
    select: { id: true, slug: true, image: true },
  });

  const galleryImages = await prisma.productImage.findMany({
    where: { url: { startsWith: "/Products/" } },
    select: { id: true, productId: true, url: true, position: true },
  });
  const galleryProductIds = [...new Set(galleryImages.map((g) => g.productId))];
  const galleryProducts = galleryProductIds.length
    ? await prisma.product.findMany({ where: { id: { in: galleryProductIds } }, select: { id: true, slug: true } })
    : [];
  const slugById = new Map(galleryProducts.map((p) => [p.id, p.slug]));

  // fname -> [{ type, id, slug, target }]
  const fileUsage = {};
  for (const p of products) {
    const fname = localFilename(p.image);
    (fileUsage[fname] ??= []).push({ type: "product", id: p.id, slug: p.slug, target: `${p.slug}.webp` });
  }
  for (const g of galleryImages) {
    const slug = slugById.get(g.productId);
    if (!slug) continue;
    const fname = localFilename(g.url);
    (fileUsage[fname] ??= []).push({ type: "gallery", id: g.id, slug, target: `${slug}-${g.position}.webp` });
  }

  const diskFileSet = new Set(diskFiles);

  const renamePlan = []; // { from, to, refs }
  const conflicts = [];
  const orphaned = [];
  const missing = []; // DB references a filename (exact case) that doesn't exist on disk

  for (const [fname, refs] of Object.entries(fileUsage)) {
    const distinctSlugs = [...new Set(refs.map((r) => r.slug))];
    if (distinctSlugs.length > 1) {
      conflicts.push({ file: fname, claimedBy: refs.map((r) => `${r.slug} (${r.type})`) });
      continue;
    }
    if (!diskFileSet.has(fname)) {
      missing.push({ file: fname, expectedBy: refs.map((r) => `${r.slug} (${r.type})`) });
      continue;
    }
    renamePlan.push({ from: fname, refs });
  }

  for (const f of diskFiles) {
    if (!fileUsage[f]) orphaned.push(f);
  }

  // ---- print report ----
  console.log(`\n${"=".repeat(70)}\nIMAGE NAMING MIGRATION ${APPLY ? "(APPLYING)" : "(DRY RUN — pass --apply to execute)"}\n${"=".repeat(70)}\n`);

  console.log(`Files to rename: ${renamePlan.length}`);
  console.log(`Conflicts (same file, different products — skipped): ${conflicts.length}`);
  console.log(`Missing (DB expects a file that isn't on disk under that exact name): ${missing.length}`);
  console.log(`Orphaned files (not referenced by any product — left alone): ${orphaned.length}`);
  console.log(`Content-duplicate groups (byte-identical, different names): ${contentDuplicates.length}\n`);

  if (conflicts.length) {
    console.log(`--- CONFLICTS (needs a real photo for all but one of these) ---`);
    for (const c of conflicts) console.log(`  ${c.file}\n    claimed by: ${c.claimedBy.join(", ")}`);
    console.log();
  }

  if (missing.length) {
    console.log(`--- MISSING (renders as broken image / logo fallback right now) ---`);
    for (const m of missing) {
      const lower = m.file.toLowerCase();
      const closeMatch = diskFiles.find((f) => f.toLowerCase() === lower && f !== m.file);
      console.log(`  ${m.file}\n    expected by: ${m.expectedBy.join(", ")}${closeMatch ? `\n    likely renamed to: ${closeMatch} — fix casing and re-run` : ""}`);
    }
    console.log();
  }

  if (orphaned.length) {
    console.log(`--- ORPHANED (on disk, unused by any product) ---`);
    orphaned.forEach((f) => console.log(`  ${f}`));
    console.log();
  }

  if (contentDuplicates.length) {
    console.log(`--- CONTENT DUPLICATES (informational, not auto-fixed) ---`);
    contentDuplicates.forEach((g) => console.log(`  ${g.join(", ")}`));
    console.log();
  }

  console.log(`--- RENAME PLAN ---`);
  let applied = 0;
  for (const { from, refs } of renamePlan) {
    const fromPath = path.join(PRODUCTS_DIR, from);
    let movedTo = null;

    for (const ref of refs) {
      const same = ref.target === from;
      console.log(`  ${from}  ->  ${ref.target}${same ? "  (already correct)" : ""}  [${ref.type}: ${ref.slug}]`);

      if (same) continue;

      if (APPLY) {
        const toPath = path.join(PRODUCTS_DIR, ref.target);
        const caseOnlyRename = toPath.toLowerCase() === fromPath.toLowerCase() && toPath !== fromPath;

        if (fs.existsSync(toPath) && !caseOnlyRename && ref.target !== movedTo) {
          console.log(`    ! skipped — ${ref.target} already exists on disk and isn't this file`);
          continue;
        }

        if (!movedTo) {
          if (caseOnlyRename) {
            // Windows' filesystem is case-insensitive, so a pure case change
            // needs a two-step rename via a temp name or it's a no-op.
            const tmpPath = fromPath + ".casetmp";
            fs.renameSync(fromPath, tmpPath);
            fs.renameSync(tmpPath, toPath);
          } else {
            fs.renameSync(fromPath, toPath);
          }
          movedTo = ref.target;
        } else {
          fs.copyFileSync(path.join(PRODUCTS_DIR, movedTo), toPath);
        }

        if (ref.type === "product") {
          await prisma.product.update({ where: { id: ref.id }, data: { image: `/Products/${ref.target}` } });
        } else {
          await prisma.productImage.update({ where: { id: ref.id }, data: { url: `/Products/${ref.target}` } });
        }
        applied++;
      }
    }
  }

  console.log(`\n${APPLY ? `Applied ${applied} rename(s) + DB update(s).` : "Dry run complete — re-run with --apply to execute."}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
