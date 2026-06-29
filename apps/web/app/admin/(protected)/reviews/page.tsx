import { prisma } from "@/lib/db";
import ReviewModerationClient from "./ReviewModerationClient";

export default async function AdminReviewsPage() {
  const reviews = await prisma.productReview.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { title: true, slug: true } } },
  });

  const serialized = reviews.map(r => ({
    id: r.id,
    productTitle: r.product.title,
    productSlug: r.product.slug,
    customerName: r.customerName,
    email: r.email,
    rating: r.rating,
    comment: r.comment,
    approved: r.approved,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#212121]">Reviews</h1>
        <p className="text-sm text-[#8D6E63] mt-1">Approve or remove customer reviews before they appear on product pages.</p>
      </div>
      <ReviewModerationClient reviews={serialized} />
    </div>
  );
}
