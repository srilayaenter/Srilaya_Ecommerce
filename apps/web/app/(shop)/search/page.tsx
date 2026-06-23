import { prisma } from "@/lib/db";
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
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          category: true,
          variants: { orderBy: { price: "asc" } },
        },
      })
    : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Search Results</h1>
      <p className="text-gray-600 mb-8">
        {query ? `Showing results for "${query}"` : "Enter a search term above"}
      </p>

      {query && products.length === 0 && (
        <p className="text-gray-500 italic py-12 text-center">
          No products found matching "{query}".
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const prices = product.variants.map((v) => parseFloat(v.price.toString()));
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const maxPrice = prices.length ? Math.max(...prices) : 0;
          const priceDisplay =
            minPrice === maxPrice
              ? `₹${minPrice.toFixed(2)}`
              : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;

          return (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group h-full flex flex-col">
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
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-sm text-indigo-600 font-semibold mb-1">
                    {product.category.name}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                    {product.description}
                  </p>
                  <span className="text-xl font-bold text-gray-900 mt-auto">
                    {priceDisplay}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}