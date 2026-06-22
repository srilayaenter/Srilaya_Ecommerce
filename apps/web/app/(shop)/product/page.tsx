import { prisma } from "@/lib/db";
import Link from "next/link";
import { toNum } from "@/lib/decimal";

export default async function AllProductsPage() {
  const products = await prisma.product.findMany();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.slug}`} className="border p-4 rounded-lg hover:shadow-md">
            <h2 className="font-bold text-lg">{product.title}</h2>
            <p className="text-sm text-gray-600 truncate">{product.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}