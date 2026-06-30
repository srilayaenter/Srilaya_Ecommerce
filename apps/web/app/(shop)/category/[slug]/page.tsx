import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { toNum } from "@/lib/decimal";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!category) return { title: "Category Not Found" };
  return {
    title: category.name,
    description:
      category.description ||
      `Shop our ${category.name} collection at SriLaYa Enterprises — 100% organic, pan-India delivery.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: {
        include: { children: true },
      },
      children: {
        include: {
          products: {
            where: { active: true },
            include: { variants: { orderBy: { price: "asc" } } },
          },
        },
      },
      products: {
        where: { active: true },
        include: { variants: { orderBy: { price: "asc" } } },
      },
    },
  });

  if (!category) {
    notFound();
  }

  const hasChildren = category.children.length > 0;
  const products = hasChildren
    ? category.children.flatMap((child) => child.products)
    : category.products;

  // Sibling chips: if this category itself has children, show those children.
  // If this category IS a child (has a parent), show its siblings instead,
  // so you can jump between Flakes/Rava/Flour/etc. from any one of them.
  const siblingChips = hasChildren
    ? category.children
    : category.parent
    ? category.parent.children
    : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>

      {siblingChips.length > 0 && (
        <div className="flex gap-3 flex-wrap mb-8">
          {siblingChips.map((sib) => (
            <Link
              key={sib.id}
              href={`/category/${sib.slug}`}
              className={`text-sm font-semibold px-3 py-1.5 rounded-full transition ${
                sib.slug === category.slug
                  ? "bg-[#006A38] text-white"
                  : "text-[#006A38] bg-[#006A38]/10 hover:bg-[#006A38]/20"
              }`}
            >
              Millet {sib.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-16">
          No products found in this category yet.
        </p>
      ) : (
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
                  <img
                    src={
                      product.image ||
                      "https://placehold.co/400x400/png?text=SriLaYa+Foods&bg=006A38&fc=white"
                    }
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
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
      )}
    </div>
  );
}