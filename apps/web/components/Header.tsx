import Link from "next/link";
import { BRAND } from "../lib/brand";

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/brand/srilaya-logo.png"
              alt={BRAND.name}
              className="h-12 w-auto object-contain"
            />
            <span className="hidden sm:block font-bold text-xl text-indigo-600">
              {BRAND.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/category/millets" className="text-gray-700 hover:text-indigo-600 font-medium">
              Millets
            </Link>
            <Link href="/category/flakes" className="text-gray-700 hover:text-indigo-600 font-medium">
              Flakes
            </Link>
            <Link href="/category/laddu" className="text-gray-700 hover:text-indigo-600 font-medium">
              Laddu
            </Link>
            <Link href="/category/sugar" className="text-gray-700 hover:text-indigo-600 font-medium">
              Sugar
            </Link>
          </nav>

          <Link href="/cart" className="relative">
            <svg className="w-7 h-7 text-gray-700 hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}