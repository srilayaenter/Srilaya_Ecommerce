import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { toNum } from "@/lib/decimal";

export default async function AllProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      category: true,
      variants: { orderBy: { price: "asc" } },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const prices = product.variants.map((v) => toNum(v.price));
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const maxPrice = prices.length ? Math.max(...prices) : 0;
          const priceDisplay =
            minPrice === maxPrice
              ? `₹${minPrice.toFixed(2)}`
              : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group border border-[#E0E0E0] rounded-xl p-4 hover:shadow-lg transition-shadow bg-white flex flex-col"
            >
              <div className="relative h-48 w-full mb-4 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={product.image || "https://placehold.co/400x400/png?text=SriLaYa+Foods&bg=006A38&fc=white"}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="text-xs text-[#006A38] font-semibold mb-1">
                {product.category.name}
              </div>
              <h2 className="font-bold text-[#212121] mb-1">{product.title}</h2>
              <p className="text-sm text-gray-500 mb-2 line-clamp-2 flex-1">
                {product.description}
              </p>
              <p className="text-xs text-gray-400 mb-2">
                {product.variants.length} size{product.variants.length !== 1 ? "s" : ""} available
              </p>
              <p className="text-[#006A38] font-black">{priceDisplay}</p>
            </Link>
          );
        })}
      </div>

      {products.length === 0 && (
        <p className="text-gray-500 text-center py-16">No products available.</p>
      )}
    </div>
  );
}