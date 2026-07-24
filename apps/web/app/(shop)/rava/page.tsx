import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import RavaPageClient from "./RavaPageClient";

export const metadata: Metadata = {
  title: "Millet Rava Collection — Nature's Granular Gems | SriLaYa Naturals",
  description:
    "Shop 7 premium millet rava varieties — Foxtail, Finger, Little, Barnyard, Pearl, Sorghum & Mapillai Samba. Low GI, high fiber, diabetic friendly. Free local delivery in Whitefield, Bangalore.",
};

// Cached for 1 hour — revalidates in background, no DB hit per request.
// Invalidated automatically when products are updated (tags: ["products"]).
const fetchRavaImages = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { category: { slug: "millet-rava" }, active: true },
      select: {
        title: true,
        image: true,
        imageUrl: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    });

    // Build map: lowercased title → best available image URL
    const map: Record<string, string> = {};
    for (const p of products) {
      const url = p.images[0]?.url ?? p.imageUrl ?? p.image ?? "";
      if (url) map[p.title.toLowerCase()] = url;
    }
    return map;
  },
  ["rava-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function RavaPage() {
  const productImageMap = await fetchRavaImages();
  return <RavaPageClient productImageMap={productImageMap} />;
}
