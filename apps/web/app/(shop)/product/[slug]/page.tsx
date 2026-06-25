import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import AddToCartWithDropdown from "@/components/AddToCartWithDropdown";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, description: true, image: true },
  });
  if (!product) return { title: "Product Not Found" };
  const desc = product.description?.slice(0, 160) || `Buy ${product.title} from SriLaYa Foods — organic, minimally processed.`;
  return {
    title: product.title,
    description: desc,
    openGraph: {
      title: `${product.title} | SriLaYa Foods`,
      description: desc,
      images: product.image ? [{ url: product.image }] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: { orderBy: { price: 'asc' } } }
  });

  if (!product) notFound();

  const serializedVariants = product.variants.map(v => ({
    id: v.id,
    size: v.size,
    price: parseFloat(v.price.toString()),
    stock: v.stock,
  }));

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-extrabold mb-4 text-[#212121]">{product.title}</h1>
      <p className="text-gray-600 mb-8 leading-relaxed text-lg">{product.description}</p>

      <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
        <h2 className="font-bold text-xl mb-6 text-[#212121]">Select Variant</h2>

        {serializedVariants.length > 0 ? (
          <AddToCartWithDropdown variants={serializedVariants} />
        ) : (
          <p className="text-gray-500 italic">No variants configured for this product.</p>
        )}
      </div>
    </div>
  );
}