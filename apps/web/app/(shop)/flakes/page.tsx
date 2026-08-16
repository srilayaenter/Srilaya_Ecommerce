import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import FlakesPageClient from "./FlakesPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Millet Flakes Collection — Instant Nutrition, Endless Variety | SriLaYa Naturals",
  description:
    "Shop 21 premium flakes — millet, heritage rice, and grain varieties. Stone-processed, instant to cook, diabetic friendly. Free local delivery in Whitefield, Bangalore.",
};

const fetchFlakesImages = unstable_cache(
  async () => {
    let products: { title: string; image: string | null; images: { url: string }[] }[] = [];
    try {
      products = await prisma.product.findMany({
        where: { category: { slug: "millet-flakes" }, active: true },
        select: {
          title: true,
          image: true,
          images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        },
      });
    } catch {}

    const map: Record<string, string> = {};
    for (const p of products) {
      const url = p.images[0]?.url ?? p.image ?? "";
      if (url) map[p.title.toLowerCase()] = url;
    }
    return map;
  },
  ["flakes-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function FlakesPage() {
  const productImageMap = await fetchFlakesImages();
  return <FlakesPageClient productImageMap={productImageMap} />;
}
