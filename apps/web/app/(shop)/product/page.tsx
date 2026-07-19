import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import type { Metadata } from "next";
import ProductListingClient from "@/components/ProductListingClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse our complete range of organic millets, millet flour, rava, flakes, rice, and traditional laddus. Multiple sizes available with pan-India delivery.",
};

const fetchProducts = unstable_cache(
  () => prisma.product.findMany({
    where: { active: true },
    include: {
      category: true,
      variants: { where: { active: true }, orderBy: { price: "asc" } },
    },
    orderBy: { title: "asc" },
  }),
  ["all-products"],
  { revalidate: 300, tags: ["products"] }
);

export default async function AllProductsPage() {
  let products: Awaited<ReturnType<typeof fetchProducts>> = [];
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("products-timeout")), 8000)
    );
    products = await Promise.race([fetchProducts(), timeout]);
  } catch {
    // DB unavailable on cold start — render empty state rather than crashing stream
  }

  // Serialise — Decimal → number so the client component gets plain objects
  const serialised = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    image: p.image,
    category: { name: p.category.name },
    variants: p.variants.map((v) => ({ price: toNum(v.price) })),
  }));

  // Deduplicated, sorted category list
  const categories = ([...new Set(products.map((p) => p.category.name as string))].sort()) as string[];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      <ProductListingClient products={serialised} categories={categories} />
    </div>
  );
}
