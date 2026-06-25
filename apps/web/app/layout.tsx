import React from "react";
import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://srilayafoods.com"),
  title: {
    default: "SriLaYa Foods — Organic Millets & Traditional Foods",
    template: "%s | SriLaYa Foods",
  },
  description:
    "Pure, minimally-processed millets, millet flour, rava, flakes, and traditional laddus sourced directly from organic farmers across India. Pan-India delivery.",
  keywords: [
    "organic millets", "buy millets online", "millet flour", "millet rava",
    "millet flakes", "millet rice", "ragi flour", "foxtail millet",
    "organic food India", "millet laddu", "SriLaYa Foods",
  ],
  authors: [{ name: "SriLaYa Foods" }],
  creator: "SriLaYa Foods",
  openGraph: {
    siteName: "SriLaYa Foods",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/brand/srilaya-logo.png", width: 512, height: 512, alt: "SriLaYa Foods" }],
  },
  twitter: {
    card: "summary",
    title: "SriLaYa Foods — Organic Millets & Traditional Foods",
    description: "Pure organic millets, flours, and traditional foods delivered pan-India.",
    images: ["/brand/srilaya-logo.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}