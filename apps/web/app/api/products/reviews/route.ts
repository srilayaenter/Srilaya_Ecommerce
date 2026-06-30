import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/products/reviews?slug=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const reviews = await prisma.productReview.findMany({
    where: { productId: product.id, approved: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      rating: true,
      comment: true,
      photoUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ reviews });
}

// POST /api/products/reviews
export async function POST(request: Request) {
  try {
    const { slug, email, customerName, rating, comment, photoUrl } = await request.json();

    if (!slug || !email || !customerName || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Verify customer has a paid order containing this product
    const paidOrder = await prisma.order.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        status: "paid",
        items: {
          some: {
            variant: { productId: product.id },
          },
        },
      },
      select: { id: true },
    });

    if (!paidOrder) {
      return NextResponse.json(
        { error: "You can only review products you have purchased." },
        { status: 403 }
      );
    }

    // Prevent duplicate review
    const existing = await prisma.productReview.findFirst({
      where: { productId: product.id, email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a review for this product." },
        { status: 409 }
      );
    }

    await prisma.productReview.create({
      data: {
        productId: product.id,
        orderId: paidOrder.id,
        customerName: customerName.trim(),
        email: email.trim().toLowerCase(),
        rating: Number(rating),
        comment: comment?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        approved: false,
      },
    });

    return NextResponse.json({ success: true, message: "Review submitted and pending approval." });
  } catch (error: any) {
    console.error("Submit review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
