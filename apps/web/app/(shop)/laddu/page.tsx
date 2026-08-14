import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import LadduPageClient from "./LadduPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Handcrafted Millet Laddus — Traditional Sweets, Natural Goodness | SriLaYa Naturals",
  description:
    "Shop SriLaYa's handcrafted millet laddus — Foxtail, Barnyard, Till & Little Millet, Groundnut, Till Sesame, Horse Gram, Green Gram, and Moth Bean, sweetened with sugarcane jaggery. No refined sugar, no preservatives.",
};

const fetchLadduImages = unstable_cache(
  async () => {
    let products: { title: string; image: string | null; images: { url: string }[] }[] = [];
    try {
      products = await prisma.product.findMany({
        where: { category: { slug: "laddu" }, active: true },
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
  ["laddu-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function LadduPage() {
  const productImageMap = await fetchLadduImages();
  return <LadduPageClient productImageMap={productImageMap} />;
}
