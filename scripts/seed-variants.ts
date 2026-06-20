//import { PrismaClient } from '../packages/db/node_modules/@prisma/client';
import { PrismaClient } from '../packages/db';
import * as bcrypt from 'bcryptjs';

// Use a unique variable name to completely avoid naming collisions
const seedPrisma = new PrismaClient();
async function main() {
  console.log('🌱 Starting database seed with variants...');

  // Wipe old data clean
  await seedPrisma.orderItem.deleteMany();
  await seedPrisma.order.deleteMany();
  await seedPrisma.cartItem.deleteMany();
  await seedPrisma.cart.deleteMany();
  await seedPrisma.productVariant.deleteMany();
  await seedPrisma.product.deleteMany();
  await seedPrisma.category.deleteMany();
  await seedPrisma.user.deleteMany();

  const flakesCategory = await seedPrisma.category.create({
    data: { slug: 'flakes', name: 'Flakes', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
  });

  const milletsCategory = await seedPrisma.category.create({
    data: { slug: 'millets', name: 'Millets', image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' }
  });

  const ladduCategory = await seedPrisma.category.create({
    data: { slug: 'laddu', name: 'Laddu', image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400' }
  });

  const sugarCategory = await seedPrisma.category.create({
    data: { slug: 'sugar', name: 'Sugar', image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400' }
  });

  console.log('✅ Categories created');

  const flakesData = [
    { name: 'Foxtail Flakes', sku: 'FF', prices: { '1kg': 189, '500g': 104 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Little Flakes', sku: 'LF', prices: { '1kg': 168, '500g': 93 }, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400' },
    { name: 'Kodo Flakes', sku: 'KF', prices: { '1kg': 159, '500g': 89 }, image: 'https://images.unsplash.com/photo-1563091133-94de5c872b71?w=400' },
    { name: 'Barnyard Flakes', sku: 'BF', prices: { '1kg': 190, '500g': 106 }, image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400' },
    { name: 'Ragi Flakes', sku: 'RF', prices: { '1kg': 101, '500g': 56 }, image: 'https://images.unsplash.com/photo-1612450822627-f5b27e66b0e8?w=400' },
    { name: 'White Sorghum Flakes', sku: 'WSF', prices: { '1kg': 98, '500g': 55 }, image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400' },
    { name: 'Red Sorghum Flakes', sku: 'RSF', prices: { '1kg': 124, '500g': 69 }, image: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=400' },
    { name: 'Pearl Flakes', sku: 'PF', prices: { '1kg': 103, '500g': 58 }, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400' },
    { name: 'Green Gram Flakes', sku: 'GGF', prices: { '1kg': 218, '500g': 120 }, image: 'https://images.unsplash.com/photo-1596797882870-8c33deeac224?w=400' },
    { name: 'Horse Gram Flakes', sku: 'HGF', prices: { '1kg': 212, '500g': 117 }, image: 'https://images.unsplash.com/photo-1583306434214-8f5e5f7e57f7?w=400' },
    { name: 'Wheat Flakes', sku: 'WF', prices: { '1kg': 121, '500g': 68 }, image: 'https://images.unsplash.com/photo-1560774082-de6d76cd3543?w=400' },
    { name: 'Barley Flakes', sku: 'BAF', prices: { '1kg': 124, '500g': 69 }, image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400' },
    { name: 'Mapillai Samba Flakes', sku: 'MSF', prices: { '1kg': 149, '500g': 82 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Karuppu Kavuni Flakes', sku: 'KKF', prices: { '1kg': 214, '500g': 119 }, image: 'https://images.unsplash.com/photo-1536304929831-aac4b5025b2f?w=400' }
  ];

  for (const item of flakesData) {
    const product = await seedPrisma.product.create({
      data: {
        slug: item.name.toLowerCase().replace(/\s+/g, '-'),
        title: item.name,
        description: `Premium ${item.name} for healthy breakfast`,
        gstRate: 5,
        sku: item.sku,
        categoryId: flakesCategory.id,
        active: true,
        rating: 4.5,
        reviews: 45,
        image: item.image
      }
    });

    for (const [size, price] of Object.entries(item.prices)) {
      await seedPrisma.productVariant.create({
        data: {
          productId: product.id,
          size: size,
          price: price,
          stock: 100,
          sku: `${item.sku}-${size.toUpperCase()}`
        }
      });
    }
  }

  console.log('✅ Flakes products created');

  const milletsData = [
    { name: 'Foxtail Millet', sku: 'FM', prices: { '1kg': 122, '500g': 52, '250g': 28 }, image: 'https://images.unsplash.com/photo-1599639957043-f3aa5c986398?w=400' },
    { name: 'Little Millet', sku: 'LM', prices: { '1kg': 94, '500g': 52, '250g': 28 }, image: 'https://images.unsplash.com/photo-1623046691569-e93684a7c4f5?w=400' },
    { name: 'Kodo Millet', sku: 'KM', prices: { '1kg': 98, '500g': 54, '250g': 30 }, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { name: 'Barnyard Millet', sku: 'BM', prices: { '1kg': 110, '500g': 61, '250g': 33 }, image: 'https://images.unsplash.com/photo-1615485737642-184e08e04f55?w=400' },
    { name: 'Ragi Millet', sku: 'RM', prices: { '1kg': 46, '500g': 26, '250g': 15 }, image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400' },
    { name: 'White Sorghum', sku: 'WS', prices: { '1kg': 51, '500g': 29, '250g': 16 }, image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=400' },
    { name: 'Red Sorghum', sku: 'RS', prices: { '1kg': 69, '500g': 38, '250g': 21 }, image: 'https://images.unsplash.com/photo-1596797882870-8c33deeac224?w=400' },
    { name: 'Pearl Millet', sku: 'PM', prices: { '1kg': 46, '500g': 26, '250g': 15 }, image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400' },
    { name: 'Proso Millet', sku: 'PR', prices: { '1kg': 94, '500g': 52, '250g': 28 }, image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400' }
  ];

  for (const item of milletsData) {
    const product = await seedPrisma.product.create({
      data: {
        slug: item.name.toLowerCase().replace(/\s+/g, '-'),
        title: item.name,
        description: `Organic ${item.name} grains for daily nutrition`,
        gstRate: 5,
        sku: item.sku,
        categoryId: milletsCategory.id,
        active: true,
        rating: 4.7,
        reviews: 60,
        image: item.image
      }
    });

    for (const [size, price] of Object.entries(item.prices)) {
      await seedPrisma.productVariant.create({
        data: {
          productId: product.id,
          size: size,
          price: price,
          stock: 100,
          sku: `${item.sku}-${size.toUpperCase()}`
        }
      });
    }
  }

  console.log('✅ Millets products created');

  const ladduData = [
    { name: 'Barnyard Millet Laddu', sku: 'BML', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400' },
    { name: 'Foxtail Millet Laddu', sku: 'FML', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400' },
    { name: 'Till Laddu', sku: 'TL', prices: { '1kg': 440, '500g': 220, '250g': 110 }, image: 'https://images.unsplash.com/photo-1606312619070-d48b4cac5a6f?w=400' },
    { name: 'Groundnut Laddu', sku: 'GL', prices: { '1kg': 420, '500g': 210, '250g': 105 }, image: 'https://images.unsplash.com/photo-1601744647628-37427e1e8ad4?w=400' }
  ];

  for (const item of ladduData) {
    const product = await seedPrisma.product.create({
      data: {
        slug: item.name.toLowerCase().replace(/\s+/g, '-'),
        title: item.name,
        description: `Traditional ${item.name} made with love`,
        gstRate: 5,
        sku: item.sku,
        categoryId: ladduCategory.id,
        active: true,
        rating: 4.9,
        reviews: 120,
        image: item.image
      }
    });

    for (const [size, price] of Object.entries(item.prices)) {
      await seedPrisma.productVariant.create({
        data: {
          productId: product.id,
          size: size,
          price: price,
          stock: 50,
          sku: `${item.sku}-${size.toUpperCase()}`
        }
      });
    }
  }

  console.log('✅ Laddu products created');

  const sugarProduct = await seedPrisma.product.create({
    data: {
      slug: 'brown-sugar',
      title: 'Brown Sugar',
      description: 'Natural brown sugar with molasses',
      gstRate: 5,
      sku: 'BS',
      categoryId: sugarCategory.id,
      active: true,
      rating: 4.7,
      reviews: 95,
      image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400'
    }
  });

  await seedPrisma.productVariant.create({
    data: { productId: sugarProduct.id, size: '1kg', price: 73, stock: 200, sku: 'BS-1KG' }
  });
  await seedPrisma.productVariant.create({
    data: { productId: sugarProduct.id, size: '500g', price: 41, stock: 200, sku: 'BS-500G' }
  });

  console.log('✅ Sugar products created');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  await seedPrisma.user.create({
    data: {
      email: 'admin@srilaya.com',
      password: hashedPassword,
      role: 'admin'
    }
  });

  console.log('✅ Admin user created');

  const productCount = await seedPrisma.product.count();
  const variantCount = await seedPrisma.productVariant.count();
  console.log(`\n🎉 Seeding completed! Created ${productCount} products with ${variantCount} variants`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await seedPrisma.$disconnect();
  });