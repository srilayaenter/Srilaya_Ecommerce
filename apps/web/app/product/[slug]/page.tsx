import { prisma } from "../../../lib/db";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

interface VariantData {
  id: string;
  price: Decimal | string;
  sku?: string;
  weight?: string;
  productId: string;
}

interface ProductWithRelations {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  description: string | null;
  gstRate: Decimal | string;
  rating: Decimal | null | string;
  reviews: number;
  categoryId: string;
  active: boolean;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  sku: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: VariantData[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const currentSlug = resolvedParams.slug;

  // Fetch products matching this specific category slug
  // We use an OR condition to match either "flakes" or "millet-flakes" smoothly
  const rawProducts = await prisma.product.findMany({
    where: {
      active: true,
      category: {
        OR: [
          { slug: currentSlug },
          { slug: `millet-${currentSlug}` },
          { slug: currentSlug.replace("millet-", "") }
        ]
      }
    },
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } }
    },
    orderBy: {
      title: 'asc'
    }
  }) as unknown as ProductWithRelations[];

  // Fetch the category name details for the title display banner
  let categoryName = currentSlug.replace("-", " ");
  if (rawProducts.length > 0 && rawProducts[0].category) {
    categoryName = rawProducts[0].category.name;
  }

  // Convert Decimals safely into plain strings for Next.js rendering
  const products = rawProducts.map(product => ({
    ...product,
    gstRate: product.gstRate ? product.gstRate.toString() : "0",
    rating: product.rating ? product.rating.toString() : "4.5",
    variants: (product.variants || []).map((variant: VariantData) => ({
      ...variant,
      price: variant.price.toString()
    }))
  }));

  return (
    <div className="bg-slate-50/50 min-h-screen text-slate-800 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Dynamic Category Page Header */}
        <div className="pb-6 mb-10 border-b border-slate-200/60">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 capitalize">
            {categoryName}
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Premium, sustainably sourced selections packaged fresh.
          </p>
        </div>

        {/* Dynamic Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-6">
            <span className="text-3xl">🌾</span>
            <p className="text-slate-500 font-bold mt-3 text-base">No active items found right now</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              We are updating our batch inventory. Check back soon or view our complete catalog to explore other items!
            </p>
            <Link 
              href="/product" 
              className="mt-6 inline-block font-bold text-xs bg-brand-green text-white hover:bg-emerald-800 px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              View Full Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div 
                key={product.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Image Wrapper */}
                <div className="w-full aspect-square bg-slate-50/50 relative overflow-hidden flex items-center justify-center p-6 border-b border-slate-50">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-slate-300 font-bold text-xs uppercase tracking-wide">No Image</div>
                  )}
                </div>

                {/* Text Details Content */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {product.category?.name || "Organic"}
                    </span>
                    <h3 className="font-bold text-slate-800 mt-2 text-base group-hover:text-brand-green transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                  </div>
                  
                  {/* Pricing Frame */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-900 font-extrabold text-base">
                      ₹{product.variants[0]?.price || "0.00"}
                    </span>
                    <Link 
                      href={`/product/${product.slug || product.id}`}
                      className="text-xs font-bold text-brand-green bg-emerald-50/50 hover:bg-brand-green hover:text-white px-3 py-1.5 rounded-xl transition-all duration-200"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}