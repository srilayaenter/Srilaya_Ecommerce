import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Admin user ────────────────────────────────────────────
  const email = 'admin@srilayafoods.com';
  const plainPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, role: 'admin' },
    create: { email, password: hashedPassword, role: 'admin' },
  });
  console.log('Admin user updated.');

  // ── Categories ────────────────────────────────────────────
  const categoryData = [
    { name: 'Millets',       slug: 'millets',       description: 'Whole millet grains — Foxtail, Ragi, Pearl, Kodo, Barnyard & more.' },
    { name: 'Millet Flakes', slug: 'millet-flakes', description: 'Quick-cook millet flakes, nutrient-dense and perfect for breakfast.' },
    { name: 'Millet Rice',   slug: 'millet-rice',   description: 'Millet-based rice alternatives — a healthier swap for white rice.' },
    { name: 'Millet Flour',  slug: 'millet-flour',  description: 'Stone-ground millet flours — Ragi, Pearl, Multi-millet blends.' },
    { name: 'Millet Rava',   slug: 'millet-rava',   description: 'Millet semolina for upma, porridge, and traditional recipes.' },
    { name: 'Laddu',         slug: 'laddu',         description: 'Traditional millet laddus — nutritious, naturally sweetened sweets.' },
    { name: 'Sweeteners',    slug: 'sweeteners',    description: 'Natural sweeteners — jaggery, palm sugar, and more.' },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
  }
  console.log(`Seeded ${categoryData.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });