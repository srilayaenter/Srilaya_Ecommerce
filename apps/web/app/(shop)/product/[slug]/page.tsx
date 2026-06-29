import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AddToCartWithDropdown from "@/components/AddToCartWithDropdown";
import ReviewsSection from "@/components/ReviewsSection";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, description: true, image: true },
  });
  if (!product) return { title: "Product Not Found" };
  const desc = product.description?.slice(0, 160) || `Buy ${product.title} from SriLaYa Foods — organic, minimally processed.`;
  return {
    title: product.title,
    description: desc,
    openGraph: {
      title: `${product.title} | SriLaYa Foods`,
      description: desc,
      images: product.image ? [{ url: product.image }] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { orderBy: { price: "asc" } },
      productReviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, customerName: true, rating: true, comment: true, createdAt: true },
      },
    },
  });

  if (!product) notFound();

  const serializedVariants = product.variants.map(v => ({
    id: v.id,
    size: v.size,
    price: parseFloat(v.price.toString()),
    stock: v.stock,
  }));

  const reviews = product.productReviews.map(r => ({
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }));

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">

        {/* Product header */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#212121]">{product.title}</h1>
          {avgRating && (
            <div className="flex items-center gap-2 mt-2">
              <StarDisplay rating={avgRating} />
              <span className="text-sm text-[#8D6E63]">
                {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
          {product.description && (
            <p className="text-gray-600 mt-4 leading-relaxed text-base">{product.description}</p>
          )}
        </div>

        {/* Variant selector */}
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
          <h2 className="font-bold text-xl mb-6 text-[#212121]">Select Variant</h2>
          {serializedVariants.length > 0 ? (
            <AddToCartWithDropdown variants={serializedVariants} />
          ) : (
            <p className="text-gray-500 italic">No variants configured for this product.</p>
          )}
        </div>

        {/* Reviews */}
        <ReviewsSection slug={slug} reviews={reviews} />

      </div>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? "#F59E0B" : "none"}
          stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}
