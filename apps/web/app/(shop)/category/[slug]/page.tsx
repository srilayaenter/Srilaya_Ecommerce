import React from 'react';
import Link from 'next/link';
import { prisma } from '../../../../lib/db';
import CategorySidebar from '../../../../components/CategorySidebar';
import { getCategoryTree } from '../../../actions/categories';

interface Props {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: Props) {
  // 1. Fetch the overall category tree hierarchy for the sidebar panel
  const categories = await getCategoryTree();

  // 2. Fetch the current active category using the URL slug parameter matching schema names
  const currentCategory = await prisma.category.findUnique({
    where: { 
      slug: params.slug 
    },
    include: {
      products: {
        where: {
          active: true, // Matches your schema's active field flag
        },
        orderBy: {
          title: 'asc', // Sorts by your schema's product 'title' field
        },
        include: {
          variants: {
            orderBy: {
              price: 'asc', // Includes pricing rows sorted lowest first
            },
          },
        },
      },
    },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Column: Interactive Navigation Panel */}
      <CategorySidebar categories={categories} />

      {/* Right Column: Dynamic Main Content Area */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb Navigation Line */}
          <nav className="text-xs text-gray-400 mb-4 flex items-center space-x-2">
            <Link href="/" className="hover:text-green-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-600 font-medium">
              {currentCategory?.name || 'Catalog'}
            </span>
          </nav>

          {/* Header Banner Section */}
          <header className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">
              {currentCategory?.name || 'Organic Products'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Premium, sustainably sourced selections packaged fresh.
            </p>
          </header>

          {/* Products Grid Context */}
          {!currentCategory || currentCategory.products.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg h-[40vh] flex items-center justify-center bg-white shadow-sm">
              <p className="text-gray-400 font-medium text-center">
                No active items found in this category right now.<br />
                <span className="text-xs text-gray-300">Check back soon or select another section!</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {currentCategory.products.map((product) => {
                // Safely grab the lowest price variant if available
                const baseVariant = product.variants[0];
                
                return (
                  <div 
                    key={product.id} 
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
                  >
                    <div className="p-5">
                      <h3 className="font-bold text-gray-800 text-lg mb-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {product.description || 'Pure organic quality, packaged fresh for your household.'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-green-700 font-bold">
                        {baseVariant ? `₹${baseVariant.price.toString()}` : 'Price on Request'}
                      </span>
                      <Link 
                        href={`/product/${product.slug}`}
                        className="text-xs font-semibold bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors shadow-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}