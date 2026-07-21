/**
 * Deletes blog posts whose title starts with "Auto Test Post"
 * created by the ADM-BLG-02 smoke test on staging.
 *
 * Run against staging:
 *   DATABASE_URL="<staging-url>" node scripts/cleanup-test-blog-posts.mjs
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const posts = await prisma.blogPost.findMany({
  where: { title: { startsWith: "Auto Test Post" } },
  select: { id: true, title: true },
});

console.log(`\nFound ${posts.length} test blog post(s) to delete.`);
posts.forEach(p => console.log(`  - [${p.id}] ${p.title}`));

if (posts.length > 0) {
  const result = await prisma.blogPost.deleteMany({
    where: { title: { startsWith: "Auto Test Post" } },
  });
  console.log(`\nDeleted ${result.count} post(s).\n`);
} else {
  console.log("\nNothing to delete.\n");
}

await prisma.$disconnect();
