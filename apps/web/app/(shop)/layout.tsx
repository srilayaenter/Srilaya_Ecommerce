import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:bg-[#006A38] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}