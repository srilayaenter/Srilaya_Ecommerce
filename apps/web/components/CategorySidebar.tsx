'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  children: Subcategory[];
  _count: { products: number };
}

export default function CategorySidebar({ categories }: { categories: Category[] }) {
  // Tracks which parent category is currently expanded
  const [activeParent, setActiveParent] = useState<string | null>(null);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 sticky top-0 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-6 tracking-tight">
        Shop by Category
      </h2>
      
      <nav className="space-y-2">
        {categories.map((category) => {
          const hasSubcategories = category.children && category.children.length > 0;
          const isExpanded = activeParent === category.id;

          return (
            <div key={category.id} className="border-b border-gray-50 pb-2">
              <button
                onClick={() => hasSubcategories && setActiveParent(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between p-2 text-left font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-all duration-200"
              >
                <span>{category.name}</span>
                
                {hasSubcategories && (
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-green-700' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Subcategories Dropdown Layout */}
              {hasSubcategories && isExpanded && (
                <div className="ml-3 mt-1 space-y-1 bg-gray-50 rounded-md p-2 border-l-2 border-green-500">
                  {category.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/category/${sub.slug}`}
                      className="flex items-center justify-between p-2 text-sm text-gray-600 hover:text-green-600 rounded transition-colors"
                    >
                      <span>{sub.name}</span>
                      {sub._count?.products !== undefined && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                          {sub._count.products}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}