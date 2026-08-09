"use client";

import Image from 'next/image';
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";

interface NavCategory { name: string; href: string; }
interface SessionUser  { name: string | null; email: string | null; }

export default function HeaderClient({
  categoryLinks,
  sessionUser,
}: {
  categoryLinks: NavCategory[];
  sessionUser: SessionUser | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { cartCount } = useCart();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = sessionUser?.name
    ? sessionUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : sessionUser?.email
    ? sessionUser.email.slice(0, 2).toUpperCase()
    : null;

  const primaryLinks: { name: string; href: string; badge?: string }[] = [
    { name: "Home",         href: "/" },
    { name: "All Products", href: "/product" },
    { name: "Collections",  href: "/collections", badge: "New" },
    { name: "Bundle Packs", href: "/bundles" },
    { name: "About Us",     href: "/about" },
    { name: "Contact Us",   href: "/contact" },
  ];

  const utilityLinks: { name: string; href: string; badge?: string }[] = [
    { name: "Track Order",     href: "/track" },
    { name: "My Orders",       href: "/account" },
    { name: "Refer & Earn",    href: "/referral" },
    { name: "Wishlist",        href: "/wishlist" },
    { name: "Payment Details", href: "/payments" },
  ];

  const infoLinks = [...primaryLinks, ...utilityLinks];

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
      <header className="w-full bg-white sticky top-0 z-50 border-b border-[#E0E0E0] font-sans shadow-sm">

        {/* ── Utility bar ── */}
        <div className="hidden lg:block bg-[#003D20]">
          <div className="container mx-auto px-4 max-w-7xl flex items-center justify-end gap-5 h-8">
            {utilityLinks.map(link => (
              <Link key={link.name} href={link.href}
                className="text-[#FFF8E1] hover:text-white text-[11px] font-semibold transition-colors whitespace-nowrap">
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Main bar ── */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16 gap-6">
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group" onClick={closeMenu}>
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#E0E0E0] shadow-sm bg-white">
                <Image src="/brand/srilaya-logo.png" alt="SriLaYa Naturals Logo" fill className="object-cover" priority />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-black text-[18px] text-[#212121] tracking-tight font-poppins">SriLaYa</span>
                <span className="font-bold text-[11px] text-[#006A38] tracking-wide uppercase">Naturals</span>
              </div>
            </Link>

            {/* Desktop primary nav */}
            <nav className="hidden lg:flex items-center gap-6 flex-grow justify-center">
              {primaryLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative text-[#424242] hover:text-[#006A38] font-semibold transition-colors text-[13.5px] whitespace-nowrap"
                >
                  {link.name}
                  {link.badge && (
                    <span className="absolute -top-2 -right-5 bg-[#D99B26] text-white text-[8px] font-black px-1 py-0.5 rounded leading-none uppercase tracking-wide">
                      {link.badge}
                    </span>
                  )}
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
                <button type="submit" aria-label="Search" className="absolute right-3 text-[#424242] hover:text-[#006A38]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </form>

              {/* Account icon */}
              <div ref={accountRef} className="relative">
                {sessionUser ? (
                  <>
                    <button
                      onClick={() => setAccountOpen(o => !o)}
                      aria-label="Account menu"
                      className="w-8 h-8 rounded-full bg-[#006A38] text-white text-[12px] font-black flex items-center justify-center hover:bg-[#00522B] transition-colors"
                    >
                      {initials}
                    </button>
                    {accountOpen && (
                      <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-[#E0E0E0] py-1 z-50">
                        <div className="px-4 py-2.5 border-b border-[#F0F0F0]">
                          <p className="text-[11px] font-bold text-[#212121] truncate">{sessionUser.name ?? sessionUser.email}</p>
                          {sessionUser.name && <p className="text-[10px] text-[#9E9E9E] truncate">{sessionUser.email}</p>}
                        </div>
                        <Link href="/account" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#424242] hover:bg-[#F5F5F5] hover:text-[#006A38] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          My Orders
                        </Link>
                        <Link href="/account#profile" onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#424242] hover:bg-[#F5F5F5] hover:text-[#006A38] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                          My Profile
                        </Link>
                        <div className="border-t border-[#F0F0F0] mt-1">
                          <button
                            onClick={() => { setAccountOpen(false); signOut({ callbackUrl: "/" }); }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#E53935] hover:bg-red-50 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/login" aria-label="Sign in"
                    className="flex items-center gap-1.5 text-[#424242] hover:text-[#006A38] transition-colors p-1">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  </Link>
                )}
              </div>

              <Link href="/cart" aria-label={cartCount > 0 ? `View cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "View cart"} className="relative text-[#424242] hover:text-[#006A38] p-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
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
        <div className="hidden lg:block bg-white border-t border-[#E0E0E0] py-2.5 overflow-x-auto">
          <div className="container mx-auto px-4 max-w-7xl flex items-center justify-center gap-6">
            {categoryLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#424242] hover:text-[#006A38] font-semibold transition-colors text-[13px] whitespace-nowrap"
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
                  <Image src="/brand/srilaya-logo.png" alt="SriLaYa Naturals" fill className="object-cover" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-black text-[15px] text-[#212121]">SriLaYa</span>
                  <span className="font-bold text-[10px] text-[#006A38] tracking-wide uppercase">Naturals</span>
                </div>
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
              <p className="text-[10px] font-black text-[#424242] uppercase tracking-widest mb-3">Menu</p>
              <ul className="space-y-1">
                {infoLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[14px] font-semibold text-[#424242] hover:bg-[#F5F5F5] hover:text-[#006A38] transition-colors"
                    >
                      {link.name}
                      {link.badge && (
                        <span className="bg-[#D99B26] text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-wide">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Category links */}
            <nav className="px-5 py-4 flex-1">
              <p className="text-[10px] font-black text-[#424242] uppercase tracking-widest mb-3">Shop by Category</p>
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
            <div className="px-5 py-4 border-t border-[#F0F0F0] bg-[#F5F5F5] space-y-2">
              <Link
                href="/cart"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 w-full bg-[#006A38] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#005A30] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                View Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              {sessionUser ? (
                <button
                  onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center justify-center gap-2 w-full border border-[#E0E0E0] text-[#E53935] font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors bg-white"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 w-full border border-[#006A38] text-[#006A38] font-bold py-3 rounded-xl text-sm hover:bg-[#F0FFF7] transition-colors bg-white"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}