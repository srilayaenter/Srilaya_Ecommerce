import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import RawMilletsPageClient from "./RawMilletsPageClient";

export const metadata: Metadata = {
  title: "Whole Millet Grains Collection — Nature's Supergrains | SriLaYa Naturals",
  description:
    "Shop SriLaYa's whole millet grain collection — 8 varieties including Foxtail, Finger (Ragi), Little, Barnyard, Kodo, Pearl (Bajra), Red & White Sorghum. 100% natural, unpolished, diabetic friendly. Free local delivery in Whitefield, Bangalore.",
};

const fetchRawMilletImages = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { category: { slug: "millet-grains" }, active: true },
      select: {
        title: true,
        image: true,
        imageUrl: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      },
    });

    const map: Record<string, string> = {};
    for (const p of products) {
      const url = p.images[0]?.url ?? p.imageUrl ?? p.image ?? "";
      if (url) map[p.title.toLowerCase()] = url;
    }
    return map;
  },
  ["raw-millet-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function RawMilletsPage() {
  const productImageMap = await fetchRawMilletImages();
  return <RawMilletsPageClient productImageMap={productImageMap} />;
}
