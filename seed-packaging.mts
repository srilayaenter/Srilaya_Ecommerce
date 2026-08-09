import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const items = [
  // Pouches
  { name: "Pouch — 200g",      category: "pouch",      unit: "pcs",    reorderThreshold: 200, notes: "For 200g product variants" },
  { name: "Pouch — 500g",      category: "pouch",      unit: "pcs",    reorderThreshold: 200, notes: "For 500g product variants" },
  { name: "Pouch — 1kg",       category: "pouch",      unit: "pcs",    reorderThreshold: 200, notes: "For 1kg product variants" },
  { name: "Pouch — 2kg",       category: "pouch",      unit: "pcs",    reorderThreshold: 100, notes: "For 2kg product variants" },
  // Boxes
  { name: "Parcel Box — Small (upto 1kg)",   category: "box", unit: "pcs", reorderThreshold: 50 },
  { name: "Parcel Box — Medium (1–3kg)",     category: "box", unit: "pcs", reorderThreshold: 50 },
  { name: "Parcel Box — Large (3–7kg)",      category: "box", unit: "pcs", reorderThreshold: 30 },
  { name: "Parcel Box — XL (7kg+)",          category: "box", unit: "pcs", reorderThreshold: 20 },
  // Tape
  { name: "Packing Tape Roll (48mm)",  category: "tape", unit: "rolls", reorderThreshold: 10 },
  { name: "Bopp Tape — Brown",         category: "tape", unit: "rolls", reorderThreshold: 10 },
  // Labels & stickers
  { name: "Product Label — Printed",         category: "label", unit: "pcs",    reorderThreshold: 500, notes: "Pre-printed product labels per variant" },
  { name: "FSSAI Sticker",                   category: "label", unit: "pcs",    reorderThreshold: 500, notes: "FSSAI logo + licence number sticker" },
  { name: "Green Dot (Veg Symbol)",           category: "label", unit: "pcs",    reorderThreshold: 500, notes: "Mandatory veg symbol — green circle dot" },
  { name: "Lot / Batch Number Label",         category: "label", unit: "pcs",    reorderThreshold: 300, notes: "For traceability — MFD + batch code" },
  { name: "Fragile Sticker",                  category: "label", unit: "pcs",    reorderThreshold: 100 },
  { name: "Thank You Card",                   category: "label", unit: "pcs",    reorderThreshold: 100 },
  // Protection
  { name: "Bubble Wrap Roll",                 category: "protection", unit: "metres", reorderThreshold: 20 },
  { name: "Silica Gel / Desiccant Sachet",   category: "protection", unit: "pcs",    reorderThreshold: 200, notes: "1g or 2g sachets — one per pouch" },
  { name: "Foam Sheet",                       category: "protection", unit: "pcs",    reorderThreshold: 50 },
  // Other
  { name: "Thermal Paper Roll (Invoice)",     category: "other", unit: "rolls", reorderThreshold: 5,  notes: "For thermal printer — invoices & packing slips" },
  { name: "Airway Bill Pouch (Transparent)",  category: "other", unit: "pcs",   reorderThreshold: 50, notes: "For courier label — stick on parcel" },
  { name: "Courier Bag — Medium",             category: "other", unit: "pcs",   reorderThreshold: 50, notes: "Tamper-evident polybag for soft parcels" },
];

let created = 0;
for (const item of items) {
  const exists = await prisma.packagingItem.findUnique({ where: { name: item.name } });
  if (exists) { console.log("  skip:", item.name); continue; }
  await prisma.packagingItem.create({ data: item });
  console.log("  ✅", item.name);
  created++;
}
console.log(`\nDone: ${created} items created.`);
await prisma.$disconnect();
