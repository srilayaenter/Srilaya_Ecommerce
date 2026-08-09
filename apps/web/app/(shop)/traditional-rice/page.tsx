import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import TraditionalRicePageClient from "./TraditionalRicePageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Traditional Rice Collection â€” Nature's Ancient Gems | SriLaYa Naturals",
  description:
    "Shop SriLaYa's heritage rice collection â€” Mapillai Samba, Karupu Kavuni (Black Rice), Poongar, and Seeraga Samba. Low GI, antioxidant-rich, traditionally cultivated. Free local delivery in Whitefield, Bangalore.",
};

const fetchRiceImages = unstable_cache(
  async () => {
    let products: { title: string; image: string | null; images: { url: string }[] }[] = [];
    try {
      products = await prisma.product.findMany({
        where: { category: { slug: "traditional-rice" }, active: true },
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
  ["traditional-rice-product-images"],
  { revalidate: 3600, tags: ["products"] }
);

export default async function TraditionalRicePage() {
  const productImageMap = await fetchRiceImages();
  return <TraditionalRicePageClient productImageMap={productImageMap} />;
}

