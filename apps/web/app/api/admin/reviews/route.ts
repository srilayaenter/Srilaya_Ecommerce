import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";
import { adminRateLimit } from "@/lib/adminGuard";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit((session.user as any).id ?? (session.user as any).email ?? "unknown");
  if (rl) return rl;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { reviewId, approved } = body;
  if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 });

  const review = await prisma.productReview.update({
    where: { id: reviewId },
    data: { approved },
  });

  // Update product aggregate rating
  const productReviews = await prisma.productReview.findMany({
    where: { productId: review.productId, approved: true },
    select: { rating: true },
  });

  const avg = productReviews.length
    ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
    : null;

  await prisma.product.update({
    where: { id: review.productId },
    data: {
      rating: avg ?? undefined,
      reviews: productReviews.length,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const rl = adminRateLimit((session.user as any).id ?? (session.user as any).email ?? "unknown");
  if (rl) return rl;

  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("id");
  if (!reviewId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const review = await prisma.productReview.delete({ where: { id: reviewId } });

  const productReviews = await prisma.productReview.findMany({
    where: { productId: review.productId, approved: true },
    select: { rating: true },
  });

  const avg = productReviews.length
    ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
    : null;

  await prisma.product.update({
    where: { id: review.productId },
    data: {
      rating: avg ?? undefined,
      reviews: productReviews.length,
    },
  });

  return NextResponse.json({ success: true });
}
