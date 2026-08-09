import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import ParboiledMilletsPageClient from "./ParboiledMilletsPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Parboiled Millet Collection â€” The Nutritional Milestone | SriLaYa Naturals",
  description:
    "Shop SriLaYa's parboiled millet collection â€” 8 varieties including Parboiled Foxtail, Finger (Ragi), Little, Barnyard, Kodo, Pearl, Red & White Sorghum. Enhanced nutrition, easier digestion, longer shelf life. Free local delivery in Whitefield, Bangalore.",
};

const fetchParboiledImages = unstable_cache(
  async () => {
    let products: { title: string; image: string | null; images: { url: string }[] }[] = [];
    try {
      products = await prisma.product.findMany({
        where: { category: { slug: "millet-parboiled" }, active: true },
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
  ["parboiled-millet-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function ParboiledMilletsPage() {
  const productImageMap = await fetchParboiledImages();
  return <ParboiledMilletsPageClient productImageMap={productImageMap} />;
}

