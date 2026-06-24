"use client";

import Image from 'next/image';
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [milletsOpen, setMilletsOpen] = useState(false);
  const router = useRouter();
  const { cartCount } = useCart();

  const infoLinks = [
    { name: "Home", href: "/" },
    { name: "All Products", href: "/product" },
    { name: "About Us", href: "/about" },
    { name: "Payment Details", href: "/payments" },
    { name: "Contact Us", href: "/contact" },
  ];

  const milletSubcategories = [
    { name: "Flakes", href: "/category/millet-flakes" },
    { name: "Rava", href: "/category/millet-rava" },
    { name: "Flour", href: "/category/millet-flour" },
    { name: "Parboiled", href: "/category/millet-parboiled" },
    { name: "Rice", href: "/category/millet-rice" },
  ];

  const otherCategoryLinks = [
    { name: "Laddu", href: "/category/laddu" },
    { name: "Sweeteners", href: "/category/sweeteners" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setSearchQuery("");
    } else {
      router.push("/product");
    }
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50 border-b border-[#E0E0E0] font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-24 gap-4">
          <Link href="/" className="flex items-center gap-4 flex-shrink-0 group">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[#E0E0E0] shadow-sm bg-white">
              <Image src="/brand/srilaya-logo.png" alt="SriLaYa Foods Logo" fill className="object-cover" priority />
            </div>
            <span className="font-black text-[26px] text-[#212121] tracking-tight font-poppins hidden sm:block">
              SriLaYa <span className="text-[#006A38]">Foods</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center justify-center gap-8 flex-grow">
            {infoLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#8D6E63] hover:text-[#006A38] font-bold transition-colors text-[14px]"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6 flex-shrink-0">
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center bg-[#F5F5F5] rounded-full border border-[#E0E0E0] w-48 xl:w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 py-2.5 text-[13px] focus:outline-none focus:border-[#006A38] text-[#212121] bg-transparent"
              />
            </form>
            <Link href="/cart" className="relative text-[#424242] hover:text-[#006A38]">
              <span className="text-2xl">🛍️</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#006A38] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-[#FFF8E1]/60 border-t border-[#E0E0E0] py-3">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-center gap-8">

          <div
            className="relative"
            onMouseEnter={() => setMilletsOpen(true)}
            onMouseLeave={() => setMilletsOpen(false)}
          >
            <Link
              href="/category/millets"
              className="text-[#8D6E63] hover:text-[#006A38] font-semibold transition-colors text-[13px] flex items-center gap-1"
            >
              Millets
              <svg
                className={`w-3 h-3 transition-transform ${milletsOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>

            {milletsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white border border-[#E0E0E0] rounded-xl shadow-lg p-2 z-50">
                {milletSubcategories.map((sub) => (
                  <Link
                    key={sub.name}
                    href={sub.href}
                    className="block px-3 py-2 text-sm text-[#8D6E63] hover:bg-[#FFF8E1] hover:text-[#006A38] rounded-lg font-medium"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {otherCategoryLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[#8D6E63] hover:text-[#006A38] font-semibold transition-colors text-[13px]"
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}