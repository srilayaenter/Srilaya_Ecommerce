import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const fetchSearchResults = unstable_cache(
  async (query: string, tokens: string[]) => {
    return Promise.all([
      prisma.product.findMany({
        where: {
          active: true,
          AND: tokens.map(t => ({
            OR: [
              { title:       { contains: t, mode: "insensitive" } },
              { description: { contains: t, mode: "insensitive" } },
              { category: { name: { contains: t, mode: "insensitive" } } },
              { sku:       { contains: t, mode: "insensitive" } },
            ],
          })),
        },
        include: {
          category: true,
          variants: { where: { active: true }, orderBy: { price: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bundle.findMany({
        where: {
          active: true,
          AND: tokens.map(t => ({
            OR: [
              { title:       { contains: t, mode: "insensitive" } },
              { description: { contains: t, mode: "insensitive" } },
            ],
          })),
        },
        take: 6,
      }),
    ]);
  },
  ["search"],
  { revalidate: 300 }
);

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const tokens = query.split(/\s+/).filter(Boolean);

  let products: any[] = [];
  let bundles: any[] = [];

  if (query) {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("search-timeout")), 8000)
      );
      [products, bundles] = await Promise.race([
        fetchSearchResults(query, tokens),
        timeout,
      ]);
    } catch {
      // DB unavailable — render empty results
    }
  }

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
            {products.length === 0 && bundles.length === 0
              ? `No results found for "${query}"`
              : `${products.length + bundles.length} result${products.length + bundles.length !== 1 ? "s" : ""} for "${query}"`}
          </p>
        )}

        {/* No results */}
        {query && products.length === 0 && bundles.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8E0D5]">
            <p className="text-5xl mb-4">🌾</p>
            <h2 className="text-lg font-bold text-[#212121] mb-2">No results found</h2>
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

        {/* Bundle results */}
        {bundles.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold text-[#9E9E9E] uppercase tracking-wider mb-3">Bundles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {bundles.map((b: any) => (
                <Link key={b.id} href={`/bundles/${b.slug}`}
                  className="bg-white border border-[#E0E0E0] rounded-2xl p-4 hover:border-[#006A38] transition-colors flex gap-4 items-center">
                  {b.imageUrl && (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-[#F9F6F0]">
                      <Image src={b.imageUrl} alt={b.title} fill sizes="64px" className="object-contain p-1" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-[#212121] text-sm">{b.title}</p>
                    {b.description && <p className="text-xs text-[#9E9E9E] mt-0.5 line-clamp-2">{b.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product grid */}
        {products.length > 0 && (
          <>
            {bundles.length > 0 && (
              <h2 className="text-sm font-bold text-[#9E9E9E] uppercase tracking-wider mb-3">Products</h2>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id:       product.id,
                    title:    product.title,
                    slug:     product.slug,
                    image:    product.image,
                    rating:   product.rating?.toString() ?? null,
                    category: { name: product.category.name },
                    variants: product.variants.map((v: any) => ({
                      id:    v.id,
                      size:  v.size,
                      price: v.price.toString(),
                      stock: v.stock,
                    })),
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
