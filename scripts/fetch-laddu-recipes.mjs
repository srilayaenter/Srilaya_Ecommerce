import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
const prisma = new PrismaClient();

// List all first to see what categories exist
const all = await prisma.opsRecipe.findMany({ select: { name: true, category: true } });
console.log("All OpsRecipe categories:", [...new Set(all.map(r => r.category))]);

const recipes = await prisma.opsRecipe.findMany({ orderBy: { name: "asc" } });

writeFileSync(
  new URL("data/laddu_recipes.json", import.meta.url),
  JSON.stringify(recipes, null, 2)
);

console.log(`Found ${recipes.length} laddu recipes`);
for (const r of recipes) {
  console.log(`\n${r.name} [${r.category}]`);
  console.log("  baseRatios:", JSON.stringify(r.baseRatios, null, 4));
}

await prisma.$disconnect();
