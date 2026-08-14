/**
 * Exports active products + variants to pricing_data.json
 * Run from repo root: node scripts/export-pricing-json.mjs
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { active: true },
  include: {
    category: { select: { name: true } },
    variants: {
      where: { active: true },
      select: {
        sku: true,
        size: true,
        weightGrams: true,
        price: true,
        stock: true,
      },
      orderBy: { weightGrams: "asc" },
    },
  },
  orderBy: [{ category: { name: "asc" } }, { title: "asc" }],
});

// Serialise Decimal to number
const serialised = products.map((p) => ({
  ...p,
  gstRate: Number(p.gstRate),
  variants: p.variants.map((v) => ({ ...v, price: Number(v.price) })),
}));

writeFileSync(
  new URL("../scripts/data/pricing_data.json", import.meta.url),
  JSON.stringify(serialised, null, 2)
);

console.log(`Exported ${serialised.length} products, ${serialised.reduce((s, p) => s + p.variants.length, 0)} variants`);
await prisma.$disconnect();
