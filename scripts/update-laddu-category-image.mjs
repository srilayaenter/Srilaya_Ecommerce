import { PrismaClient } from "@prisma/client";

const targetUrl = process.env.TARGET_DATABASE_URL;
if (!targetUrl) {
  console.error('Set TARGET_DATABASE_URL first, e.g.:\n  $env:TARGET_DATABASE_URL = "postgresql://...staging..."');
  process.exit(1);
}

const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });
const BASE = "https://szsrdtiphbdpdfggxwpw.supabase.co/storage/v1/object/public/media/naturals/products/";

const updates = [
  { slug: "laddu", image: BASE + "barnyard-millet-laddu.webp" },
  { slug: "millet-parboiled", image: BASE + "barnyard-parboiled-rice.webp" },
  { slug: "millet-flakes", image: BASE + "foxtail-flakes.webp" },
  { slug: "millet-rice", image: BASE + "foxtail-rice.webp" },
  { slug: "millet-flour", image: null },
  { slug: "millet-rava", image: null },
  { slug: "sweeteners", image: null },
];

async function main() {
  for (const u of updates) {
    const r = await target.category.update({ where: { slug: u.slug }, data: { image: u.image } });
    console.log(r.name, "->", r.image ?? "(null)");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => target.$disconnect());
