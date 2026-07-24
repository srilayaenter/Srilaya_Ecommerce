import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import FlourPageClient from "./FlourPageClient";

export const metadata: Metadata = {
  title: "Millet Flour Collection — Bake Better, Eat Smarter | SriLaYa Naturals",
  description:
    "Shop 8 premium millet flours — Foxtail, Finger (Ragi), Red Sorghum, Barnyard, Pearl, Sprouted Ragi, Kodo & Wheat. Stone-ground, whole grain, diabetic friendly. Free local delivery in Whitefield, Bangalore.",
};

const fetchFlourImages = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { category: { slug: "millet-flour" }, active: true },
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
  ["flour-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function FlourPage() {
  const productImageMap = await fetchFlourImages();
  return <FlourPageClient productImageMap={productImageMap} />;
}
