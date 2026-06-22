import { prisma } from "@/lib/db";
import Link from "next/link";
import { toNum } from "@/lib/decimal";
import Image from "next/image";
import { Prisma } from "@prisma/client";

// 1. Define the query structure once to ensure type consistency
const productQuery = {
  include: { variants: true },
} satisfies Prisma.ProductFindManyArgs;

// 2. Use GetPayload to automatically generate the correct type
type ProductWithVariants = Prisma.ProductGetPayload<typeof productQuery>;

export default async function HomePage() {
  const products: ProductWithVariants[] = await prisma.product.findMany(productQuery);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-[#212121] mb-6">
          Pure Organic Millets from Mysuru
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={`/product/${product.slug}`}
            className="group border border-[#E0E0E0] rounded-xl p-4 hover:shadow-lg transition-shadow bg-white"
          >
            <div className="relative h-48 w-full mb-4 overflow-hidden rounded-lg bg-gray-100">
              <Image 
                src={product.imageUrl || "https://placehold.co/400x400/006A38/white?text=SriLaYa+Foods"} 
                alt={product.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform" 
              />
            </div>
            <h2 className="font-bold text-[#212121]">{product.title}</h2>
            <p className="text-sm text-gray-500 mb-2 truncate">{product.description}</p>
            {product.variants.length > 0 && (
              <p className="text-[#006A38] font-black">
                ₹{toNum(product.variants[0].price).toFixed(2)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}