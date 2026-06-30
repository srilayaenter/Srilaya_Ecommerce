import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AddToCartWithDropdown from "@/components/AddToCartWithDropdown";
import ReviewsSection from "@/components/ReviewsSection";
import ProductGallery from "@/components/ProductGallery";
import RecentlyViewed from "@/components/RecentlyViewed";
import RecordView from "@/components/RecordView";
import ProductRecommendations from "@/components/ProductRecommendations";
import PincodeCheck from "@/components/PincodeCheck";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, description: true, image: true },
  });
  if (!product) return { title: "Product Not Found" };
  const desc = product.description?.slice(0, 160) || `Buy ${product.title} from SriLaYa Enterprises — organic, minimally processed.`;
  return {
    title: product.title,
    description: desc,
    openGraph: {
      title: `${product.title} | SriLaYa Enterprises`,
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
      images: { orderBy: { position: "asc" } },
      productReviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, customerName: true, rating: true, comment: true, photoUrl: true, createdAt: true },
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
    photoUrl: r.photoUrl,
    createdAt: r.createdAt.toISOString(),
  }));

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const lowestPrice = product.variants.length
    ? Math.min(...product.variants.map(v => parseFloat(v.price.toString())))
    : null;
  const inStock = product.variants.some(v => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? `Buy ${product.title} from ${BRAND.name}`,
    image: product.image ?? undefined,
    brand: { "@type": "Brand", name: BRAND.name },
    ...(lowestPrice !== null && {
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: lowestPrice,
        availability: inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: BRAND.name },
      },
    }),
    ...(avgRating !== null && reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
  };

  const galleryImages = product.images.map(img => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
  }));

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* ── Two-column product layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

          {/* Left — image gallery */}
          <div className="md:sticky md:top-28">
            <ProductGallery
              images={galleryImages}
              fallback={product.image ?? null}
              title={product.title}
            />
          </div>

          {/* Right — details + purchase */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#212121] leading-tight">{product.title}</h1>
              {avgRating && (
                <div className="flex items-center gap-2 mt-2">
                  <StarDisplay rating={avgRating} />
                  <span className="text-sm text-[#8D6E63]">
                    {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
              {lowestPrice !== null && (
                <p className="mt-3 text-2xl font-black text-[#006A38]">
                  ₹{lowestPrice.toFixed(2)}
                  <span className="text-sm font-medium text-[#9E9E9E] ml-2">onwards</span>
                </p>
              )}
              {product.description && (
                <p className="text-[#555] mt-4 leading-relaxed text-sm">{product.description}</p>
              )}
            </div>

            {/* Variant selector + add to cart */}
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-base mb-4 text-[#212121]">Select Size & Add to Cart</h2>
              {serializedVariants.length > 0 ? (
                <AddToCartWithDropdown variants={serializedVariants} />
              ) : (
                <p className="text-gray-500 italic text-sm">No variants configured for this product.</p>
              )}
            </div>

            {/* Pincode check */}
            <PincodeCheck />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🌱", label: "100% Organic" },
                { icon: "🚚", label: "Pan-India Delivery" },
                { icon: "↩️", label: "7-Day Returns" },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1 bg-white border border-[#E0E0E0] rounded-xl py-3 px-2 text-center">
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-[11px] font-semibold text-[#555]">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Reviews — full width below ── */}
        <div className="mt-14">
          <ReviewsSection slug={slug} reviews={reviews} />
        </div>

        {/* ── Customers also bought ── */}
        <ProductRecommendations slug={slug} />

        {/* ── Recently viewed ── */}
        <div className="mt-6 border-t border-[#E0E0E0] pt-8">
          <RecentlyViewed excludeSlug={slug} />
        </div>

      </div>

      {/* Record this view in localStorage */}
      <RecordView
        slug={slug}
        title={product.title}
        image={product.image ?? null}
        price={lowestPrice ?? 0}
      />
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
