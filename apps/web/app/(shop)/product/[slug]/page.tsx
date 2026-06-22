import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { toNum } from "@/lib/decimal";
import AddToCartButton from "@/components/AddToCartButton";

type Params = Promise<{ slug: string }>;

export default async function ProductDetailPage({ params }: { params: Params }) {
  // Fix for "No value exists in scope for the shorthand property 'slug'"
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true }
  });

  if (!product) notFound();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-extrabold mb-4 text-[#212121]">{product.title}</h1>
      <p className="text-gray-600 mb-8 leading-relaxed text-lg">{product.description}</p>

      <div className="bg-white border border-[#E0E0E0] rounded-xl p-8 shadow-sm">
        <h2 className="font-bold text-xl mb-6 text-[#212121]">Select Variant</h2>
        
        {product.variants.length > 0 ? (
          <div className="grid gap-6">
            {/* Fix for "Parameter 'variant' implicitly has an 'any' type" */}
            {product.variants.map((variant: any) => (
              <div 
                key={variant.id} 
                className="flex items-center justify-between border-b border-[#E0E0E0] pb-6 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-bold text-lg">{variant.size}</p>
                  <p className="text-[#006A38] font-black text-lg">
                    ₹{toNum(variant.price).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {variant.stock > 0 
                      ? `In Stock: ${variant.stock}` 
                      : <span className="text-red-500 font-bold">Out of Stock</span>}
                  </p>
                </div>
                
                {variant.stock > 0 ? (
                  <AddToCartButton variantId={variant.id} />
                ) : (
                  <button disabled className="bg-gray-200 text-gray-400 px-6 py-2.5 rounded-lg font-bold cursor-not-allowed">
                    Unavailable
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No variants configured for this product.</p>
        )}
      </div>
    </div>
  );
}