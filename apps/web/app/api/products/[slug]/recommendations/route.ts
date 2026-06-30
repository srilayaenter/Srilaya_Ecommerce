import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, variants: { select: { id: true } } },
  });
  if (!product) return NextResponse.json({ products: [] });

  const variantIds = product.variants.map(v => v.id);

  // Find orders that contain this product
  const orderIds = await prisma.orderItem.findMany({
    where: { variantId: { in: variantIds } },
    select: { orderId: true },
    distinct: ["orderId"],
    take: 200,
  });

  if (orderIds.length === 0) return NextResponse.json({ products: [] });

  // Find other variants purchased in those orders
  const coItems = await prisma.orderItem.findMany({
    where: {
      orderId:   { in: orderIds.map(o => o.orderId) },
      variantId: { notIn: variantIds },
    },
    select: { variant: { select: { productId: true } } },
  });

  // Count frequency per product
  const freq: Record<string, number> = {};
  for (const item of coItems) {
    const pid = item.variant.productId;
    freq[pid] = (freq[pid] ?? 0) + 1;
  }

  const topIds = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id);

  if (topIds.length === 0) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
    where: { id: { in: topIds }, active: true },
    select: {
      id: true, slug: true, title: true, image: true,
      variants: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
    },
  });

  // Preserve frequency order
  const sorted = topIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  return NextResponse.json({
    products: sorted.map(p => ({
      slug:  p!.slug,
      title: p!.title,
      image: p!.image,
      price: p!.variants[0] ? parseFloat(p!.variants[0].price.toString()) : null,
    })),
  });
}
