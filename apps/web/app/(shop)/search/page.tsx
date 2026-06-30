import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const products = query
    ? await prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { title:       { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { name: { contains: query, mode: "insensitive" } } },
            { sku:         { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          category: true,
          variants: { orderBy: { price: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Suggestions when no results
  const suggestions = ["millet", "rice", "flakes", "flour", "rava", "sweetener"];

  return (
    <div className="min-h-screen bg-[#F9F6F0]">

      {/* Hero strip */}
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins mb-3">
          {query ? `Results for "${query}"` : "Search Products"}
        </h1>
        {/* Inline search bar */}
        <form method="GET" action="/search" className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search millets, flakes, flour…"
            autoFocus={!query}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm text-[#212121] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFF8E1]"
          />
          <button
            type="submit"
            className="bg-[#FFF8E1] text-[#006A38] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* No query state */}
        {!query && (
          <div className="text-center py-12">
            <p className="text-[#424242] text-sm mb-4">Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(s => (
                <Link
                  key={s}
                  href={`/search?q=${s}`}
                  className="bg-white border border-[#E0E0E0] text-[#424242] px-4 py-2 rounded-full text-sm font-medium hover:border-[#006A38] hover:text-[#006A38] transition-colors capitalize"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        {query && (
          <p className="text-sm text-[#424242] mb-6 font-medium">
            {products.length === 0
              ? `No products found for "${query}"`
              : `${products.length} product${products.length !== 1 ? 's' : ''} found for "${query}"`}
          </p>
        )}

        {/* No results */}
        {query && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8E0D5]">
            <p className="text-5xl mb-4">🌾</p>
            <h2 className="text-lg font-bold text-[#212121] mb-2">No products found</h2>
            <p className="text-sm text-[#424242] mb-6">Try a different keyword or browse our categories.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(s => (
                <Link
                  key={s}
                  href={`/search?q=${s}`}
                  className="bg-[#F5F5F5] text-[#424242] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#006A38] hover:text-white transition-colors capitalize"
                >
                  {s}
                </Link>
              ))}
            </div>
            <Link href="/product" className="inline-block mt-6 text-[#006A38] font-bold text-sm hover:underline">
              Browse all products →
            </Link>
          </div>
        )}

        {/* Product grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={{
                  id:       product.id,
                  title:    product.title,
                  slug:     product.slug,
                  image:    product.image,
                  rating:   product.rating?.toString() ?? null,
                  category: { name: product.category.name },
                  variants: product.variants.map(v => ({
                    id:    v.id,
                    size:  v.size,
                    price: v.price.toString(),
                    stock: v.stock,
                  })),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
