/**
 * Uploads local /Products/ product images to Supabase Storage (same "media"
 * bucket + naturals/products/ folder that admin-panel uploads already use)
 * and updates Product.image to the resulting public URL. Keeps the {slug}.webp
 * naming convention in storage instead of admin-upload's timestamp+random name.
 *
 * Idempotent (upsert:true on the storage write). Dry run by default.
 * Run:   node scripts/migrate-images-to-supabase.mjs
 * Apply: node scripts/migrate-images-to-supabase.mjs --apply
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = path.join(__dirname, "..", "apps", "web", "public", "Products");
const BUCKET = "media";
const FOLDER = "naturals/products";
const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient();

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
  const products = await prisma.product.findMany({
    where: { image: { startsWith: "/Products/" } },
    select: { id: true, slug: true, title: true, image: true },
    orderBy: { slug: "asc" },
  });

  console.log(`\n${"=".repeat(70)}\nMIGRATE IMAGES TO SUPABASE STORAGE ${APPLY ? "(APPLYING)" : "(DRY RUN — pass --apply to execute)"}\n${"=".repeat(70)}\n`);
  console.log(`Found ${products.length} product(s) with a local /Products/ image.\n`);

  const supabase = APPLY ? getSupabase() : null;
  let migrated = 0;
  const missingLocal = [];

  for (const p of products) {
    const localName = decodeURIComponent(p.image.replace("/Products/", ""));
    const localPath = path.join(PRODUCTS_DIR, localName);
    if (!fs.existsSync(localPath)) {
      missingLocal.push(`${p.slug} -> ${localName}`);
      continue;
    }

    const storagePath = `${FOLDER}/${p.slug}.webp`;
    console.log(`${p.title} (${p.slug})\n  local:    ${p.image}\n  storage:  ${BUCKET}/${storagePath}`);

    if (APPLY) {
      const buffer = fs.readFileSync(localPath);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: "image/webp", upsert: true });
      if (error) {
        console.log(`    ! upload failed: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      await prisma.product.update({ where: { id: p.id }, data: { image: data.publicUrl } });
      console.log(`    -> ${data.publicUrl}`);
      migrated++;
    }
  }

  if (missingLocal.length) {
    console.log(`\nSkipped (DB points to a local file that doesn't exist):`);
    missingLocal.forEach((m) => console.log(`  ${m}`));
  }

  console.log(`\n${APPLY ? `Migrated ${migrated} product(s) to Supabase Storage.` : "Dry run complete — re-run with --apply to upload + update DB."}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
