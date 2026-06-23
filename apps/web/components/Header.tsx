"use client";

import Image from 'next/image';
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const infoLinks = [
    { name: "Home", href: "/" },
    { name: "All Products", href: "/product" },
    { name: "About Us", href: "/about" },
    { name: "Payment Details", href: "/payments" },
    { name: "Contact Us", href: "/contact" },
  ];

  const productLinks = [
    { name: "Millet Flakes", href: "/category/millet-flakes" },
    { name: "Millet Laddu", href: "/category/laddu" },
    { name: "Millet Rava", href: "/category/millet-rava" },
    { name: "Millet Flour", href: "/category/millet-flour" },
    { name: "Millet Parboiled", href: "/category/millet-parboiled" },
    { name: "Millet Rice", href: "/category/millet-rice" },
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
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-[#FFF8E1]/60 border-t border-[#E0E0E0] py-3">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-center gap-8">
          {productLinks.map((link) => (
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