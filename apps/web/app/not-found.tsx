import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black text-naturals-green mb-2">404</div>
        <h1 className="text-2xl font-bold text-[#212121] mb-3">Page not found</h1>
        <p className="text-[#9E9E9E] mb-8 text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-naturals-green text-white font-bold px-6 py-3 rounded-xl hover:bg-naturals-green-dark transition-colors text-sm"
          >
            Go to Homepage
          </Link>
          <Link
            href="/product"
            className="border border-naturals-green text-naturals-green font-bold px-6 py-3 rounded-xl hover:bg-[#e8f5ee] transition-colors text-sm"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </main>
  );
}
