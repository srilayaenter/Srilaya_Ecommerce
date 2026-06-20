"use client";

import Image from 'next/image';
import Link from "next/link";
import { BRAND } from "../lib/brand";
import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Clean, structured main categories matching your navbar
  const mainCategories = [
    { name: "Millets", slug: "millets" },
    { name: "Flakes", slug: "flakes" },
    { name: "Laddu", slug: "laddu" },
    { name: "Sugar", slug: "sugar" },
  ];

  // Dynamic list containing your sub-varieties visible in your tables
  const subCategories = [
    { name: "Millet Rava", slug: "millet-rava" },
    { name: "Millet Flour", slug: "millet-flour" },
    { name: "Millet Parboiled", slug: "millet-parboiled" },
    { name: "Millet Rice", slug: "millet-rice" },
    { name: "Sweeteners", slug: "sweeteners" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/srilaya-logo.png"
              alt={BRAND.name}
              width={48}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="hidden sm:block font-bold text-xl text-brand-green">
              {BRAND.name}
            </span>
          </Link>

          {/* Navigation Bar Table Menu */}
          <nav className="hidden md:flex items-center gap-8 relative h-full">
            {mainCategories.map((cat) => (
              <Link 
                key={cat.slug} 
                href={`/category/${cat.slug}`} 
                className="text-gray-700 hover:text-brand-green font-medium transition-colors py-2"
              >
                {cat.name}
              </Link>
            ))}

            {/* Interactive Sub-Category Dropdown Trigger */}
            <div 
              className="relative h-full flex items-center cursor-pointer group py-2"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <span className="text-gray-700 group-hover:text-brand-green font-medium transition-colors flex items-center gap-1">
                More Varieties
                <svg 
                  className={`w-4 h-4 text-gray-400 group-hover:text-brand-green transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>

              {/* Mega Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-100 shadow-xl rounded-xl p-4 transition-all duration-200 z-50 mt-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                    Sub Categories
                  </div>
                  <div className="flex flex-col gap-1">
                    {subCategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/category/${sub.slug}`}
                        className="px-2 py-2 hover:bg-slate-50 text-slate-700 hover:text-brand-green rounded-md font-medium text-sm transition-colors block"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Shopping Cart Icon */}
          <Link href="/cart" className="relative group">
            <svg 
              className="w-7 h-7 text-gray-700 group-hover:text-brand-green transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
          </Link>
          
        </div>
      </div>
    </header>
  );
}