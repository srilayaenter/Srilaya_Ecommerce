import { prisma } from "../lib/db";
import { BRAND } from "../lib/brand";
import Link from "next/link";

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } }
    },
    take: 8,
    orderBy: { reviews: 'desc' }
  });

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } }
    }
  });

  return (
    <div>
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">{BRAND.name}</h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              Premium Organic Millets & Traditional Foods from Mysuru
            </p>
            <p className="text-lg mb-8">
              Discover the goodness of ancient grains - millets, flakes, and traditional laddus made with love and care
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/category/millets">
                <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition">
                  Shop Millets
                </button>
              </Link>
              <Link href="/category/flakes">
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-indigo-600 transition">
                  Browse Flakes
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map(category => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition text-center cursor-pointer">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-4xl bg-gray-50">
                      {category.name === 'Flakes' && '🌾'}
                      {category.name === 'Millets' && '🌱'}
                      {category.name === 'Laddu' && '🍬'}
                      {category.name === 'Sugar' && '🍯'}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm">{category._count.products} products</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600">Handpicked selections from our premium collection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => {
              const prices = product.variants.map(v => parseFloat(v.price.toString()));
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const priceDisplay = minPrice === maxPrice
                ? `₹${minPrice}`
                : `₹${minPrice} - ₹${maxPrice}`;
              const ratingDisplay = product.rating ? parseFloat(product.rating.toString()).toFixed(1) : '4.5';

              return (
                <Link key={product.id} href={`/product/${product.slug}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="text-sm text-indigo-600 font-semibold mb-1">
                        {product.category.name}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.variants.length} size{product.variants.length > 1 ? 's' : ''} available
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">{priceDisplay}</span>
                        <span className="text-sm text-gray-600">⭐ {ratingDisplay}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/category/millets">
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
                View All Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Srilaya Millets?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl mb-3">100% Organic</h3>
              <p className="text-gray-600">All our products are certified organic and chemical-free</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl mb-3">Best Prices</h3>
              <p className="text-gray-600">Direct from farmers to your home at competitive prices</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl mb-3">Free Shipping</h3>
              <p className="text-gray-600">Free delivery on all orders across India</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Healthy Journey?</h2>
          <p className="text-xl mb-8 text-indigo-100">
            Order now and get your first taste of authentic millets from Mysuru
          </p>
          <Link href="/category/millets">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition">
              Start Shopping
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}