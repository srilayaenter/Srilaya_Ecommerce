import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/brand";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#212121] text-white">
      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#006A38] bg-white flex-shrink-0">
                <Image src="/brand/srilaya-logo.png" alt="SriLaYa Enterprises Logo" fill className="object-cover" />
              </div>
              <span className="font-black text-xl text-white tracking-tight">
                SriLaYa <span className="text-[#4CAF50]">Enterprises</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Pure organic millets, flakes, and traditional foods sourced directly from Indian farmers.
            </p>
            <p className="text-xs text-slate-500 font-mono">{BRAND.phone}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">{BRAND.email}</p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><Link href="/product" className="hover:text-[#4CAF50] transition-colors">All Products</Link></li>
              <li><Link href="/category/millet-flakes" className="hover:text-[#4CAF50] transition-colors">Millet Flakes</Link></li>
              <li><Link href="/category/millet-flour" className="hover:text-[#4CAF50] transition-colors">Millet Flour</Link></li>
              <li><Link href="/category/laddu" className="hover:text-[#4CAF50] transition-colors">Laddu</Link></li>
              <li><Link href="/category/sweeteners" className="hover:text-[#4CAF50] transition-colors">Sweeteners</Link></li>
              <li><Link href="/bundles" className="hover:text-[#4CAF50] transition-colors">Bundle Packs</Link></li>
              <li><Link href="/cart" className="hover:text-[#4CAF50] transition-colors">Cart</Link></li>
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li><Link href="/about" className="hover:text-[#4CAF50] transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-[#4CAF50] transition-colors">Blog & Recipes</Link></li>
              <li><Link href="/contact" className="hover:text-[#4CAF50] transition-colors">Contact Us</Link></li>
              <li><Link href="/track" className="hover:text-[#4CAF50] transition-colors">Track Order</Link></li>
              <li><Link href="/account" className="hover:text-[#4CAF50] transition-colors">My Orders</Link></li>
              <li><Link href="/wishlist" className="hover:text-[#4CAF50] transition-colors">Wishlist</Link></li>
              <li><Link href="/referral" className="hover:text-[#4CAF50] transition-colors">Refer & Earn</Link></li>
            </ul>
          </div>

          {/* Address & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Our Location</h4>
            <address className="not-italic text-sm text-slate-300 leading-relaxed">
              SriLaYa Enterprises<br />
              White Field Hoskote Main Road,<br />
              Seegehalli, Bengaluru<br />
              Karnataka — 560067
            </address>
            <p className="text-xs text-slate-500 mt-3">
              Mon–Sat: 9:00 AM – 6:00 PM
            </p>
            {BRAND.gstin && (
              <p className="text-[11px] text-slate-600 mt-2 font-mono">
                GSTIN: {BRAND.gstin}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 max-w-7xl py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            © {currentYear} {BRAND.name}. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <span>🔒</span> 256-Bit SSL Secured &nbsp;|&nbsp; <span>🌾</span> 100% Organic
          </p>
        </div>
      </div>
    </footer>
  );
}
