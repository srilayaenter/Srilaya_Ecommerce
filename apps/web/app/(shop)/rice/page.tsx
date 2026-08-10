import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import RicePageClient from "./RicePageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Millet Rice Collection — Whole Grain, Cooked Like Rice | SriLaYa Naturals",
  description:
    "Shop 12 whole grain millet varieties cooked like rice — Foxtail, Barnyard, Kodo, Little, Browntop, Pearl, Ragi and more. Low GI, high fibre, diabetic friendly.",
};

const fetchRiceImages = unstable_cache(
  async () => {
    let products: { title: string; image: string | null; images: { url: string }[] }[] = [];
    try {
      products = await prisma.product.findMany({
        where: { category: { slug: "millet-rice" }, active: true },
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
  ["rice-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function RicePage() {
  const productImageMap = await fetchRiceImages();
  return <RicePageClient productImageMap={productImageMap} />;
}
