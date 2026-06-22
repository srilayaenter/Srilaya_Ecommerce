import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { toNum } from "@/lib/decimal"; // Ensure this is imported

// Next.js 15 requires params to be a Promise
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  // 1. Properly await the parameters
  const { slug } = await params;

  // 2. Fetch data
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true }
  });

  if (!product) notFound();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-extrabold mb-2">{product.title}</h1>
      <p className="text-gray-600 mb-8">{product.description}</p>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-4">Available Sizes</h2>
        
        {product.variants.length > 0 ? (
          <div className="grid gap-3">
            {product.variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-bold">{variant.size}</p>
                  {/* Using toNum to correctly format the Decimal price */}
                  <p className="text-green-700 font-bold">₹{toNum(variant.price).toFixed(2)}</p>
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No stock available for this item currently.</p>
        )}
      </div>
    </div>
  );
}