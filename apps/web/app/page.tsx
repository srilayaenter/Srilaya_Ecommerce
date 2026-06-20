import { prisma } from "../lib/db";
import { BRAND } from "../lib/brand";
import Link from "next/link";
import ProductCard from "../components/ProductCard";

export default async function HomePage() {
  const rawFeaturedProducts = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } }
    },
    take: 8,
    orderBy: { reviews: 'desc' }
  });

  // Fetch categories, filtering out the main "Millets" category completely
  const categories = await prisma.category.findMany({
    where: {
      NOT: {
        name: {
          equals: "Millets",
          mode: "insensitive"
        }
      }
    },
    include: {
      _count: { select: { products: true } }
    }
  });

  // Convert Decimals to clean plain string data objects to pass to Client Components safely
  const featuredProducts = rawFeaturedProducts.map(product => ({
    ...product,
    gstRate: product.gstRate ? product.gstRate.toString() : "0",
    rating: product.rating ? product.rating.toString() : "4.5",
    variants: product.variants.map(variant => ({
      ...variant,
      price: variant.price.toString()
    }))
  }));

  return (
    <div className="bg-white min-h-screen text-slate-800">
      {/* 1. HERO BANNER */}
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">{BRAND.name}</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Premium Organic Millets & Traditional Foods from Mysuru
          </p>
        </div>
      </section>

      {/* 2. CIRCULAR CATEGORIES SLIDER LAYOUT */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Shop by Category</h2>
          <div className="flex items-start gap-6 overflow-x-auto pb-4 pt-2 justify-center flex-wrap">
            {categories.map(category => (
              <Link 
                key={category.id} 
                href={`/category/${category.slug}`}
                className="flex flex-col items-center flex-shrink-0 w-24 text-center group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 group-hover:border-emerald-700 shadow-sm transition-all duration-300 bg-white flex items-center justify-center text-3xl">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl select-none">
                      {/* Emojis matching your new database names */}
                      {category.name.toLowerCase().includes('rava') && '🥣'}
                      {category.name.toLowerCase().includes('flake') && '🌾'}
                      {category.name.toLowerCase().includes('laddu') && '🍬'}
                      {category.name.toLowerCase().includes('flour') && '🥡'}
                      {category.name.toLowerCase().includes('parboiled') && '🍚'}
                      {category.name.toLowerCase().includes('rice') && '🌾'}
                      {category.name.toLowerCase().includes('sweet') && '🍯'}
                      {category.name.toLowerCase().includes('sugar') && '🍯'}
                      {category.name.toLowerCase().includes('millet') && '🌱'}
                    </span>
                  )}
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  {/* Displays whatever name is currently inside the database */}
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS INTERACTIVE GRID */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}