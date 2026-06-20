import { PrismaClient } from '../packages/db';
import * as bcrypt from 'bcryptjs';

// Unique client pointer to avoid global namespace conflicts inside the monorepo workspace
const seedPrisma = new PrismaClient();

// Type definitions ensuring layout strict structural data consistency
interface CategoryConfig {
  name: string;
  slug: string;
  image: string;
  subcategories?: {
    name: string;
    slug: string;
    image: string;
    products: any[];
  }[];
  standaloneProducts?: any[];
}

// ==========================================================================
// 1. RAW PRODUCT DATASHEETS (YOUR CORE INVENTORY ASSETS)
// ==========================================================================

// Flakes Dataset (Precise updated pricing sheets)
const flakesData = [
  { name: 'Foxtail Flakes', sku: 'FF', prices: { '1kg': 137, '200g': 38 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Premium organic Foxtail Flakes for breakfast nutrition' },
  { name: 'Little Flakes', sku: 'LF', prices: { '1kg': 170, '200g': 45 }, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400', description: 'Premium organic Little Flakes for breakfast nutrition' },
  { name: 'Kodo Flakes', sku: 'KF', prices: { '1kg': 153, '200g': 42 }, image: 'https://images.unsplash.com/photo-1563091133-94de5c872b71?w=400', description: 'Premium organic Kodo Flakes for breakfast nutrition' },
  { name: 'Barnyard Flakes', sku: 'BF', prices: { '1kg': 177, '200g': 47 }, image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400', description: 'Premium organic Barnyard Flakes for breakfast nutrition' },
  { name: 'Ragi Flakes', sku: 'RF', prices: { '1kg': 109, '200g': 33 }, image: 'https://images.unsplash.com/photo-1612450822627-f5b27e66b0e8?w=400', description: 'Premium organic Ragi Flakes for breakfast nutrition' },
  { name: 'Pearl Flakes', sku: 'PF', prices: { '1kg': 105, '200g': 32 }, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400', description: 'Premium organic Pearl Flakes for breakfast nutrition' },
  { name: 'Red Sorghum Flakes', sku: 'RSF', prices: { '1kg': 124, '200g': 35 }, image: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=400', description: 'Premium organic Red Sorghum Flakes for breakfast nutrition' },
  { name: 'White Sorghum Flakes', sku: 'WSF', prices: { '1kg': 107, '200g': 33 }, image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400', description: 'Premium organic White Sorghum Flakes for breakfast nutrition' },
  { name: 'Barley Flakes', sku: 'BAF', prices: { '1kg': 124, '200g': 35 }, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400', description: 'Premium organic Barley Flakes for breakfast nutrition' }
];

// Rava Dataset
const ravaData = [
  { name: 'Foxtail Rava', sku: 'FTR', prices: { '1kg': 137, '500g': 75 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Organic Foxtail Rava fine semolina for healthy recipes' },
  { name: 'Little Rava', sku: 'LTRV', prices: { '1kg': 182, '500g': 97 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Organic Little Rava fine semolina for healthy recipes' },
  { name: 'Barnyard Rava', sku: 'BYRV', prices: { '1kg': 199, '500g': 107 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Organic Barnyard Rava fine semolina for healthy recipes' }
];

// Flour Dataset
const flourData = [
  { name: 'Little Flour', sku: 'LTFL', prices: { '1kg': 135, '500g': 75 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Nutritious multi-purpose Little Flour stone-ground flour' },
  { name: 'Ragi Flour', sku: 'RGFL', prices: { '1kg': 78, '500g': 44 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Nutritious multi-purpose Ragi Flour stone-ground flour' },
  { name: 'Foxtail Flour', sku: 'FTFL', prices: { '1kg': 103, '500g': 58 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Nutritious multi-purpose Foxtail Flour stone-ground flour' },
  { name: 'Barnyard Flour', sku: 'BYFL', prices: { '1kg': 152, '500g': 84 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Nutritious multi-purpose Barnyard Flour stone-ground flour' },
  { name: 'Pearl Flour', sku: 'PLFL', prices: { '1kg': 68, '500g': 39 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Nutritious multi-purpose Pearl Flour stone-ground flour' }
];

// Millet Rice Dataset
const milletRiceData = [
  { name: 'Foxtail Rice', sku: 'FXR', prices: { '1kg': 121, '500g': 67 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Organic whole-grain raw Foxtail Rice fields product' },
  { name: 'Little Rice', sku: 'LTR', prices: { '1kg': 150, '500g': 83 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Organic whole-grain raw Little Rice fields product' },
  { name: 'Kodo Rice', sku: 'KDR', prices: { '1kg': 148, '500g': 82 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Organic whole-grain raw Kodo Rice fields product' },
  { name: 'Barnyard Rice', sku: 'BYR', prices: { '1kg': 165, '500g': 91 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Organic whole-grain raw Barnyard Rice fields product' },
  { name: 'Ragi Rice', sku: 'RGR', prices: { '1kg': 102, '500g': 57 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Organic whole-grain raw Ragi Rice fields product' },
  { name: 'Pearl Rice', sku: 'PLR', prices: { '1kg': 89, '500g': 50 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Organic whole-grain raw Pearl Rice fields product' },
  { name: 'White Sorghum Rice', sku: 'WSR', prices: { '1kg': 90, '500g': 51 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Organic whole-grain raw White Sorghum Rice fields product' }
];

// Millet Parboiled Dataset
const parboiledData = [
  { name: 'Foxtail Parboiled Rice', sku: 'FPR', prices: { '1kg': 121, '500g': 67 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Easily digestible hydrothermal parboiled Foxtail Parboiled Rice' },
  { name: 'Little Parboiled Rice', sku: 'LPR', prices: { '1kg': 150, '500g': 83 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Easily digestible hydrothermal parboiled Little Parboiled Rice' },
  { name: 'Kodo Parboiled Rice', sku: 'KPR', prices: { '1kg': 148, '500g': 82 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Easily digestible hydrothermal parboiled Kodo Parboiled Rice' },
  { name: 'Barnyard Parboiled Rice', sku: 'BPR', prices: { '1kg': 165, '500g': 91 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Easily digestible hydrothermal parboiled Barnyard Parboiled Rice' },
  { name: 'Ragi Parboiled Rice', sku: 'RPR', prices: { '1kg': 102, '500g': 57 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Easily digestible hydrothermal parboiled Ragi Parboiled Rice' },
  { name: 'Pearl Parboiled Rice', sku: 'PPR', prices: { '1kg': 89, '500g': 50 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Easily digestible hydrothermal parboiled Pearl Parboiled Rice' },
  { name: 'White Sorghum Parboiled Rice', sku: 'WPR', prices: { '1kg': 90, '500g': 51 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', description: 'Easily digestible hydrothermal parboiled White Sorghum Parboiled Rice' }
];

// Laddu Dataset
const ladduData = [
  { name: 'Barnyard Millet Laddu', sku: 'BML', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400', description: 'Traditional healthy organic Barnyard Millet Laddu made with natural coconut jaggery powder' },
  { name: 'Foxtail Millet Laddu', sku: 'FML', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400', description: 'Traditional healthy organic Foxtail Millet Laddu made with natural coconut jaggery powder' },
  { name: 'Till Laddu', sku: 'TL', prices: { '1kg': 440, '500g': 220, '250g': 110 }, image: 'https://images.unsplash.com/photo-1606312619070-d48b4cac5a6f?w=400', description: 'Traditional healthy organic Till Laddu made with natural coconut jaggery powder' },
  { name: 'Groundnut Laddu', sku: 'GL', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1601744647628-37427e1e8ad4?w=400', description: 'Traditional healthy organic Groundnut Laddu made with natural coconut jaggery powder' }
];

// ==========================================================================
// 2. MASTER DYNAMIC CATALOG TREE (EASY TO EXPAND AND EXTEND IN FUTURE)
// ==========================================================================
const dynamicCatalogSchema: CategoryConfig[] = [
  {
    name: 'Millets',
    slug: 'millets',
    image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400',
    subcategories: [
      { name: 'Flakes', slug: 'millet-flakes', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', products: flakesData },
      { name: 'Rava', slug: 'millet-rava', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', products: ravaData },
      { name: 'Flour', slug: 'millet-flour', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', products: flourData },
      { name: 'Millet Parboiled', slug: 'millet-parboiled', image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', products: parboiledData },
      { name: 'Millet Rice', slug: 'millet-rice', image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400', products: milletRiceData }
    ]
  },
  {
    name: 'Laddu',
    slug: 'laddu',
    image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400',
    standaloneProducts: ladduData
  },
  {
    name: 'Sweeteners',
    slug: 'sweeteners',
    image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400',
    standaloneProducts: [
      { name: 'Brown Sugar', sku: 'BS', prices: { '1kg': 73, '500g': 41 }, image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400', description: 'Natural unrefined brown sugar crystals with rich molasses extraction' }
    ]
  }
];

// ==========================================================================
// 3. SEEDING ENGINE AUTOMATION LOOPS
// ==========================================================================
async function main() {
  console.log('🌱 Starting structural automated database seed matrix execution...');

  // Wipe database elements clean in cascade order to protect tracking dependencies
  await seedPrisma.orderItem.deleteMany();
  await seedPrisma.order.deleteMany();
  await seedPrisma.cartItem.deleteMany();
  await seedPrisma.cart.deleteMany();
  await seedPrisma.productVariant.deleteMany();
  await seedPrisma.product.deleteMany();
  await seedPrisma.category.deleteMany();
  await seedPrisma.user.deleteMany();

  // Dynamically iterate through the entire matrix layout definitions mapping relations
  for (const group of dynamicCatalogSchema) {
    const parentCategory = await seedPrisma.category.create({
      data: { name: group.name, slug: group.slug, image: group.image }
    });
    console.log(`✅ Main Category Built: ${group.name}`);

    // Processes subcategories if assigned down the object layout branch
    if (group.subcategories) {
      for (const nestedSub of group.subcategories) {
        const subCategory = await seedPrisma.category.create({
          data: { 
            name: nestedSub.name, 
            slug: nestedSub.slug, 
            image: nestedSub.image, 
            parentId: parentCategory.id // Safely linked via schema relations
          }
        });

        // Seed products assigned to this subcategory ID
        for (const item of nestedSub.products) {
          await createProductWithVariants(item, subCategory.id, item.description);
        }
        console.log(`   └── ✅ Nested Subcategory & Items Mapped: ${nestedSub.name}`);
      }
    }

    // Processes standard standalone items that attach straight to main categories
    if (group.standaloneProducts) {
      for (const item of group.standaloneProducts) {
        const productStock = group.slug === 'laddu' ? 50 : 200;
        await createProductWithVariants(item, parentCategory.id, item.description, productStock);
      }
      console.log(`   └── ✅ Standalone items mapped directly under: ${group.name}`);
    }
  }

  // ==========================================
  // 4. MANAGEMENT PASSWORDS SECURITY PROVISIONING
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

  const totalProducts = await seedPrisma.product.count();
  const totalVariants = await seedPrisma.productVariant.count();
  console.log(`\n🎉 Seeding operations completed successfully! Loaded ${totalProducts} total products with ${totalVariants} unique structural variant pack selections.`);
}

// Global automated schema product-to-variant mapping factory handler
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