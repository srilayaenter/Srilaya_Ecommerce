import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    include: {
      category: true,
      variants: { orderBy: { price: "asc" } },
    },
  });

  return NextResponse.json({
    products: products.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      image: p.image,
      rating: p.rating?.toString() ?? null,
      category: { name: p.category.name },
      variants: p.variants.map(v => ({
        id: v.id,
        size: v.size,
        price: v.price.toString(),
        stock: v.stock,
      })),
    })),
  });
}
