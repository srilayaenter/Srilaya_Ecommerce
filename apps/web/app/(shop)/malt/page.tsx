import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import MaltPageClient from "./MaltPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Malt & Health Mixes — Instant Nutrition Drinks | SriLaYa Naturals",
  description:
    "Shop SriLaYa's Ragi Malts and Sathu Maavu — multigrain health drink mixes with no refined sugar, no artificial flavours. Ready in seconds, packed with natural goodness.",
};

const fetchMaltImages = unstable_cache(
  async () => {
    let products: { title: string; image: string | null; images: { url: string }[] }[] = [];
    try {
      products = await prisma.product.findMany({
        where: { category: { slug: "malt-and-health-mixes" }, active: true },
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
  ["malt-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function MaltPage() {
  const productImageMap = await fetchMaltImages();
  return <MaltPageClient productImageMap={productImageMap} />;
}
