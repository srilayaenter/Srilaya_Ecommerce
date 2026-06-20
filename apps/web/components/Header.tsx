"use client";

import Image from 'next/image';
import Link from "next/link";
import { BRAND } from "../lib/brand";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Line 1 Links: Core informational menu pages
  const infoLinks = [
    { name: "Home", href: "/" },
    { name: "All Products", href: "/product" },
    { name: "About Us", href: "/about" },
    { name: "Payment Details", href: "/payments" },
    { name: "Contact Us", href: "/contact" },
  ];

  // Line 2 Links: Updated to pass category as a query parameter cleanly
  const productLinks = [
    { name: "Millet Flakes", href: "/product?category=flakes" },
    { name: "Millet Laddu", href: "/product?category=laddu" },
    { name: "Millet Rava", href: "/product?category=millet-rava" },
    { name: "Millet Flour", href: "/product?category=millet-flour" },
    { name: "Millet Parboiled", href: "/product?category=millet-parboiled" },
    { name: "Millet Rice", href: "/product?category=millet-rice" },
    { name: "Sweeteners", href: "/product?category=sweeteners" },
  ];

  // Handles active search routing dynamically and clears the text field
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    if (query) {
      router.push(`/product?search=${encodeURIComponent(query)}`);
      setSearchQuery(""); 
    } else {
      router.push("/product");
    }
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50 border-b border-slate-100">
      
      {/* ROW 1: LOGO, CENTERED INFO PAGES, ACTIVE SEARCH, AND BASKET */}
      <div className="container mx-auto px-4 border-b border-slate-100">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Left Side: Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <Image
              src="/brand/srilaya-logo.png"
              alt={BRAND.name}
              width={48}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="font-extrabold text-xl text-brand-green tracking-tight">
              {BRAND.name}
            </span>
          </Link>

          {/* Center: Core Info Links centered dynamically */}
          <nav className="hidden lg:flex items-center justify-center gap-6 flex-grow h-full mx-4">
            {infoLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-gray-700 hover:text-brand-green font-bold transition-colors py-2 text-sm whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Side: Active Search Input Box & Notification Cart Icon */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <form 
              onSubmit={handleSearchSubmit} 
              className="relative flex items-center bg-slate-50 rounded-xl overflow-hidden text-slate-700 border border-slate-200 w-40 xl:w-56"
            >
              <input
                type="text"
                placeholder="search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-1.5 text-xs focus:outline-none placeholder-slate-400 font-medium bg-transparent"
              />
              <button 
                type="submit" 
                className="absolute right-2.5 text-slate-400 hover:text-brand-green transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <Link href="/cart" className="relative p-2 hover:bg-slate-50 rounded-xl transition-colors group">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                />
              </svg>
              <span className="absolute top-0.5 right-0.5 bg-amber-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                0
              </span>
            </Link>
          </div>
          
        </div>
      </div>

      {/* ROW 2: SPECIFIC PRODUCT ITEMS PERFECTLY CENTERED */}
      <div className="bg-slate-50/50 py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-center gap-x-8 gap-y-2 overflow-x-auto no-scrollbar scroll-smooth">
            {productLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="text-slate-600 hover:text-brand-green font-bold transition-colors text-xs xl:text-sm whitespace-nowrap tracking-wide"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </header>
  );
}