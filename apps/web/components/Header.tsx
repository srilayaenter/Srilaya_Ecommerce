"use client";

import Image from 'next/image';
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { cartCount } = useCart();

  const infoLinks = [
    { name: "Home", href: "/" },
    { name: "All Products", href: "/product" },
    { name: "About Us", href: "/about" },
    { name: "Track Order", href: "/track" },
    { name: "My Orders", href: "/account" },
    { name: "Wishlist", href: "/wishlist" },
    { name: "Bundle Packs", href: "/bundles" },
    { name: "Payment Details", href: "/payments" },
    { name: "Contact Us", href: "/contact" },
  ];

  const categoryLinks = [
    { name: "Millets", href: "/category/millets" },
    { name: "Millet Flakes", href: "/category/millet-flakes" },
    { name: "Millet Rice", href: "/category/millet-rice" },
    { name: "Millet Flour", href: "/category/millet-flour" },
    { name: "Millet Rava", href: "/category/millet-rava" },
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="w-full bg-white shadow-sm sticky top-0 z-50 border-b border-[#E0E0E0] font-sans">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group" onClick={closeMenu}>
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#E0E0E0] shadow-sm bg-white">
                <Image src="/brand/srilaya-logo.png" alt="SriLaYa Foods Logo" fill className="object-cover" priority />
              </div>
              <span className="font-black text-[22px] text-[#212121] tracking-tight font-poppins hidden sm:block">
                SriLaYa <span className="text-[#006A38]">Foods</span>
              </span>
            </Link>

            {/* Desktop nav */}
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

            <div className="flex items-center gap-3 flex-shrink-0">
              <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center bg-[#F5F5F5] rounded-full border border-[#E0E0E0] w-44 xl:w-60">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 text-[13px] focus:outline-none text-[#212121] bg-transparent"
                />
                <button type="submit" className="absolute right-3 text-[#8D6E63] hover:text-[#006A38]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </form>

              <Link href="/cart" className="relative text-[#424242] hover:text-[#006A38] p-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#006A38] text-white text-[10px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] min-h-[18px] px-0.5">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                className="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg border border-[#E0E0E0] gap-1.5 hover:bg-[#F5F5F5] transition-colors flex-shrink-0"
              >
                <span className="block w-4.5 h-0.5 bg-[#424242] rounded" />
                <span className="block w-4.5 h-0.5 bg-[#424242] rounded" />
                <span className="block w-3 h-0.5 bg-[#424242] rounded" />
              </button>
            </div>
          </div>
        </div>

        {/* Category strip — desktop */}
        <div className="hidden lg:block bg-[#FFF8E1]/60 border-t border-[#E0E0E0] py-2.5 overflow-x-auto">
          <div className="container mx-auto px-4 max-w-7xl flex items-center justify-center gap-6">
            {categoryLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#8D6E63] hover:text-[#006A38] font-semibold transition-colors text-[13px] whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
          />

          {/* panel */}
          <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col overflow-y-auto">
            {/* panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 overflow-hidden rounded-full border border-[#E0E0E0]">
                  <Image src="/brand/srilaya-logo.png" alt="SriLaYa Foods" fill className="object-cover" />
                </div>
                <span className="font-black text-[16px] text-[#212121]">
                  SriLaYa <span className="text-[#006A38]">Foods</span>
                </span>
              </div>
              <button
                onClick={closeMenu}
                aria-label="Close menu"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] text-[#424242] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-4 border-b border-[#F0F0F0]">
              <form onSubmit={(e) => { handleSearchSubmit(e); closeMenu(); }} className="flex items-center bg-[#F5F5F5] rounded-xl border border-[#E0E0E0] px-3 py-2 gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-[13px] focus:outline-none bg-transparent text-[#212121]"
                />
              </form>
            </div>

            {/* Nav links */}
            <nav className="px-5 py-4 border-b border-[#F0F0F0]">
              <p className="text-[10px] font-black text-[#8D6E63] uppercase tracking-widest mb-3">Menu</p>
              <ul className="space-y-1">
                {infoLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className="block px-3 py-2.5 rounded-lg text-[14px] font-semibold text-[#424242] hover:bg-[#F5F5F5] hover:text-[#006A38] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Category links */}
            <nav className="px-5 py-4 flex-1">
              <p className="text-[10px] font-black text-[#8D6E63] uppercase tracking-widest mb-3">Shop by Category</p>
              <ul className="space-y-1">
                {categoryLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[14px] font-semibold text-[#424242] hover:bg-emerald-50 hover:text-[#006A38] transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006A38] flex-shrink-0" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#F0F0F0] bg-[#FFF8E1]/60">
              <Link
                href="/cart"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 w-full bg-[#006A38] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#005A30] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                View Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}