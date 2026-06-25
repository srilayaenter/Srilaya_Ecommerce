import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mapping: Record<string, string> = {
  'Barnyard Rice': 'Barnyard-millet.png',
  'Foxtail Rice': 'Foxtail-Millet.png',
  'Kodo Rice': 'kodo-Millet.png',
  'Little Rice': 'Little-Millet.png',
  'Pearl Rice': 'NativePearl-Millet.png',
  'White Sorghum Rice': 'WhiteSorghum-millet.png',
  'Ragi Rice': 'Ragi-Millet.png',
  'Red Sorghum Rice': 'RedSorghum-Millet.png',
  'Proso Rice': 'Proso-Millet.png',
};

async function main() {
  console.log('🖼️  Assigning remaining local product images (rice/whole-grain)...\n');

  let updated = 0;
  let notFound: string[] = [];

  for (const [title, filename] of Object.entries(mapping)) {
    const result = await prisma.product.updateMany({
      where: { title },
      data: { image: `/Products/${filename}` },
    });

    if (result.count > 0) {
      console.log(`✅ ${title} -> /Products/${filename}`);
      updated += result.count;
    } else {
      console.log(`⚠️  No product found with title "${title}"`);
      notFound.push(title);
    }
  }

  console.log(`\n🎉 Done. Updated ${updated} product(s).`);
  if (notFound.length > 0) {
    notFound.forEach((t) => console.log(`   - still missing: ${t}`));
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());