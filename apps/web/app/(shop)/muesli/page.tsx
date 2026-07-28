import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import MuesliPageClient from "./MuesliPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Muesli & Granola Collection — Instant Millet Meal Revolution | SriLaYa Naturals",
  description:
    "Shop SriLaYa's ready-to-eat muesli and granola collection — 8 varieties including Honey, Chocolate, Strawberry, Nutty, Fruits, Sugar Free, and Stevia Muesli. Whole grain, all natural, no preservatives. Free local delivery in Whitefield, Bangalore.",
};

const fetchMuesliImages = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: { category: { slug: "muesli-and-granola" }, active: true },
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
  ["muesli-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function MuesliPage() {
  const productImageMap = await fetchMuesliImages();
  return <MuesliPageClient productImageMap={productImageMap} />;
}
