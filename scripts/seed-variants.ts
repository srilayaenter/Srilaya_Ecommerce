import { PrismaClient } from '../packages/db';
import * as bcrypt from 'bcryptjs';

// Unique client pointer to avoid global namespace conflicts inside the monorepo workspace
const seedPrisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with nested categories and precise pricing inventory...');

  // Clean slate data truncation in order of dependency constraints
  await seedPrisma.orderItem.deleteMany();
  await seedPrisma.order.deleteMany();
  await seedPrisma.cartItem.deleteMany();
  await seedPrisma.cart.deleteMany();
  await seedPrisma.productVariant.deleteMany();
  await seedPrisma.product.deleteMany();
  await seedPrisma.category.deleteMany();
  await seedPrisma.user.deleteMany();

  // ==========================================
  // 1. TOP-LEVEL MAIN CATEGORY CONFIGURATIONS
  // ==========================================
  const milletsCategory = await seedPrisma.category.create({
    data: { slug: 'millets', name: 'Millets', image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' }
  });

  const ladduCategory = await seedPrisma.category.create({
    data: { slug: 'laddu', name: 'Laddu', image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400' }
  });

  const sweetenersCategory = await seedPrisma.category.create({
    data: { slug: 'sweeteners', name: 'Sweeteners', image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400' }
  });

  console.log('✅ Main categories initialized');

  // ==========================================
  // 2. NESTED SUBCATEGORY PROVISIONS (UNDER MILLETS)
  // ==========================================
  const flakesSubCategory = await seedPrisma.category.create({
    data: { slug: 'millet-flakes', name: 'Flakes', parentId: milletsCategory.id, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
  });

  const ravaSubCategory = await seedPrisma.category.create({
    data: { slug: 'millet-rava', name: 'Rava', parentId: milletsCategory.id, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
  });

  const flourSubCategory = await seedPrisma.category.create({
    data: { slug: 'millet-flour', name: 'Flour', parentId: milletsCategory.id, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
  });

  const parboiledSubCategory = await seedPrisma.category.create({
    data: { slug: 'millet-parboiled', name: 'Millet Parboiled', parentId: milletsCategory.id, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' }
  });

  const riceSubCategory = await seedPrisma.category.create({
    data: { slug: 'millet-rice', name: 'Millet Rice', parentId: milletsCategory.id, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' }
  });

  console.log('✅ Millet subcategories initialized');

  // ==========================================
  // 3. PRODUCT SPECIFIC RAW INVENTORY DATASET
  // ==========================================

  // Flakes Dataset (Precise updated pricing sheets)
  const flakesData = [
    { name: 'Foxtail Flakes', sku: 'FF', prices: { '1kg': 137, '200g': 38 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Little Flakes', sku: 'LF', prices: { '1kg': 170, '200g': 45 }, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400' },
    { name: 'Kodo Flakes', sku: 'KF', prices: { '1kg': 153, '200g': 42 }, image: 'https://images.unsplash.com/photo-1563091133-94de5c872b71?w=400' },
    { name: 'Barnyard Flakes', sku: 'BF', prices: { '1kg': 177, '200g': 47 }, image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400' },
    { name: 'Ragi Flakes', sku: 'RF', prices: { '1kg': 109, '200g': 33 }, image: 'https://images.unsplash.com/photo-1612450822627-f5b27e66b0e8?w=400' },
    { name: 'Pearl Flakes', sku: 'PF', prices: { '1kg': 105, '200g': 32 }, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400' },
    { name: 'Red Sorghum Flakes', sku: 'RSF', prices: { '1kg': 124, '200g': 35 }, image: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=400' },
    { name: 'White Sorghum Flakes', sku: 'WSF', prices: { '1kg': 107, '200g': 33 }, image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400' },
    { name: 'Barley Flakes', sku: 'BAF', prices: { '1kg': 124, '200g': 35 }, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400' }
  ];

  // Rava Dataset
  const ravaData = [
    { name: 'Foxtail Rava', sku: 'FTR', prices: { '1kg': 137, '500g': 75 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Little Rava', sku: 'LTRV', prices: { '1kg': 182, '500g': 97 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Barnyard Rava', sku: 'BYRV', prices: { '1kg': 199, '500g': 107 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
  ];

  // Flour Dataset
  const flourData = [
    { name: 'Little Flour', sku: 'LTFL', prices: { '1kg': 135, '500g': 75 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Ragi Flour', sku: 'RGFL', prices: { '1kg': 78, '500g': 44 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Foxtail Flour', sku: 'FTFL', prices: { '1kg': 103, '500g': 58 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Barnyard Flour', sku: 'BYFL', prices: { '1kg': 152, '500g': 84 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Pearl Flour', sku: 'PLFL', prices: { '1kg': 68, '500g': 39 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
  ];

  // Millet Rice Dataset
  const milletRiceData = [
    { name: 'Foxtail Rice', sku: 'FXR', prices: { '1kg': 121, '500g': 67 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Little Rice', sku: 'LTR', prices: { '1kg': 150, '500g': 83 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Kodo Rice', sku: 'KDR', prices: { '1kg': 148, '500g': 82 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Barnyard Rice', sku: 'BYR', prices: { '1kg': 165, '500g': 91 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Ragi Rice', sku: 'RGR', prices: { '1kg': 102, '500g': 57 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Pearl Rice', sku: 'PLR', prices: { '1kg': 89, '500g': 50 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'White Sorghum Rice', sku: 'WSR', prices: { '1kg': 90, '500g': 51 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' }
  ];

  // Millet Parboiled Dataset
  const parboiledData = [
    { name: 'Foxtail Parboiled Rice', sku: 'FPR', prices: { '1kg': 121, '500g': 67 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Little Parboiled Rice', sku: 'LPR', prices: { '1kg': 150, '500g': 83 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Kodo Parboiled Rice', sku: 'KPR', prices: { '1kg': 148, '500g': 82 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Barnyard Parboiled Rice', sku: 'BPR', prices: { '1kg': 165, '500g': 91 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Ragi Parboiled Rice', sku: 'RPR', prices: { '1kg': 102, '500g': 57 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Pearl Parboiled Rice', sku: 'PPR', prices: { '1kg': 89, '500g': 50 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'White Sorghum Parboiled Rice', sku: 'WPR', prices: { '1kg': 90, '500g': 51 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' }
  ];

  // Laddu Dataset
  const ladduData = [
    { name: 'Barnyard Millet Laddu', sku: 'BML', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400' },
    { name: 'Foxtail Millet Laddu', sku: 'FML', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400' },
    { name: 'Till Laddu', sku: 'TL', prices: { '1kg': 440, '500g': 220, '250g': 110 }, image: 'https://images.unsplash.com/photo-1606312619070-d48b4cac5a6f?w=400' },
    { name: 'Groundnut Laddu', sku: 'GL', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1601744647628-37427e1e8ad4?w=400' }
  ];

  // ==========================================
  // 4. DATA PROCESSING LOOPS EXECUTION
  // ==========================================

  // Commit Flakes
  for (const item of flakesData) {
    await createProductWithVariants(item, flakesSubCategory.id, `Premium organic ${item.name} flakes for breakfast nutrition`);
  }
  console.log('✅ Millet Flakes seeded');

  // Commit Rava
  for (const item of ravaData) {
    await createProductWithVariants(item, ravaSubCategory.id, `Organic ${item.name} fine semolina for healthy recipes`);
  }
  console.log('✅ Millet Rava seeded');

  // Commit Flour
  for (const item of flourData) {
    await createProductWithVariants(item, flourSubCategory.id, `Nutritious multi-purpose ${item.name} stone-ground flour`);
  }
  console.log('✅ Millet Flour seeded');

  // Commit Rice
  for (const item of milletRiceData) {
    await createProductWithVariants(item, riceSubCategory.id, `Organic whole-grain raw ${item.name} fields product`);
  }
  console.log('✅ Millet Rice seeded');

  // Commit Parboiled
  for (const item of parboiledData) {
    await createProductWithVariants(item, parboiledSubCategory.id, `Easily digestible hydrothermal parboiled ${item.name}`);
  }
  console.log('✅ Millet Parboiled seeded');

  // Commit Laddus
  for (const item of ladduData) {
    await createProductWithVariants(item, ladduCategory.id, `Traditional healthy organic ${item.name} made with natural sweeteners`, 50);
  }
  console.log('✅ Laddu varieties seeded');

  // Commit Sweeteners Products
  const sugarProduct = await seedPrisma.product.create({
    data: {
      slug: 'brown-sugar',
      title: 'Brown Sugar',
      description: 'Natural unrefined brown sugar crystals with rich molasses extraction',
      gstRate: 5,
      sku: 'BS',
      categoryId: sweetenersCategory.id,
      active: true,
      rating: 4.7,
      reviews: 95,
      image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400'
    }
  });
  await seedPrisma.productVariant.create({ data: { productId: sugarProduct.id, size: '1kg', price: 73, stock: 200, sku: 'BS-1KG' } });
  await seedPrisma.productVariant.create({ data: { productId: sugarProduct.id, size: '500g', price: 41, stock: 200, sku: 'BS-500G' } });
  console.log('✅ Sweeteners products seeded');

  // ==========================================
  // 5. SECURITY & USERS SEEDING
  // ==========================================
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await seedPrisma.user.create({
    data: {
      email: 'admin@srilaya.com',
      password: hashedPassword,
      role: 'admin'
    }
  });
  console.log('✅ Admin management credential built');

  // Total summary printouts
  const totalProducts = await seedPrisma.product.count();
  const totalVariants = await seedPrisma.productVariant.count();
  console.log(`\n🎉 Seeding operations completed successfully! Loaded ${totalProducts} total products with ${totalVariants} unique structural variant pack selections.`);
}

// Global automated schema product-to-variant data mapping helper factory
async function createProductWithVariants(item: any, catId: string, description: string, baseStock = 100) {
  const product = await seedPrisma.product.create({
    data: {
      slug: item.name.toLowerCase().replace(/\s+/g, '-'),
      title: item.name,
      description: description,
      gstRate: 5,
      sku: item.sku,
      categoryId: catId,
      active: true,
      rating: 4.5,
      reviews: 32,
      image: item.image
    }
  });

  for (const [size, price] of Object.entries(item.prices)) {
    await seedPrisma.productVariant.create({
      data: {
        productId: product.id,
        size: size,
        price: price as number,
        stock: baseStock,
        sku: `${item.sku}-${size.toUpperCase()}`
      }
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error caught during database seed context handling loop:', e);
    process.exit(1);
  })
  .finally(async () => {
    await seedPrisma.$disconnect();
  });