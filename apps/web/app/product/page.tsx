import { prisma } from "../../lib/db";
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
  searchParams: Promise<{ search?: string }>;
}

export default async function AllProductsPage({ searchParams }: PageProps) {
  // Await search params safely for Next.js async page routing compliance
  const resolvedSearchParams = await searchParams;
  const searchFilter = resolvedSearchParams.search || "";

  // Fetch active products dynamically matching search keywords case-insensitively if provided
  const rawProducts = await prisma.product.findMany({
    where: { 
      active: true,
      ...(searchFilter ? {
        OR: [
          { title: { contains: searchFilter, mode: "insensitive" } },
          { description: { contains: searchFilter, mode: "insensitive" } }
        ]
      } : {})
    },
    include: {
      category: true,
      variants: { orderBy: { price: 'asc' } }
    },
    orderBy: { 
      title: 'asc' 
    }
  }) as unknown as ProductWithRelations[];

  // Convert Decimals safely into plain strings for rendering
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
        
        {/* Page Header Section */}
        <div className="pb-6 mb-10 border-b border-slate-200/60">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {searchFilter ? `Search Results for "${searchFilter}"` : "Our Complete Catalog"}
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            {searchFilter 
              ? `Found ${products.length} product${products.length === 1 ? "" : "s"} matching your keyword.`
              : "Explore our entire selection of premium organic millets, traditional staples, and natural sweeteners."
            }
          </p>
        </div>

        {/* Products Dynamic Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-6">
            <span className="text-3xl">🔍</span>
            <p className="text-slate-500 font-bold mt-3 text-base">No products found</p>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
              We couldn't find anything matching your query. Double check the spelling or browse our category selections instead!
            </p>
            <Link 
              href="/product" 
              className="mt-6 inline-block font-bold text-xs bg-brand-green text-white hover:bg-emerald-800 px-4 py-2 rounded-xl transition-all"
            >
              Clear Search & View All
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div 
                key={product.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Image Section */}
                <div className="w-full aspect-square bg-slate-50/50 relative overflow-hidden flex items-center justify-center p-6 border-b border-slate-50">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-slate-300 font-bold text-xs uppercase tracking-wide">No Image Provided</div>
                  )}
                </div>

                {/* Info Text Content */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {product.category?.name || "Organic"}
                    </span>
                    <h3 className="font-bold text-slate-800 mt-2 text-base group-hover:text-brand-green transition-colors line-clamp-1">
                      {product.title}
                    </h3>
                  </div>
                  
                  {/* Pricing Details */}
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