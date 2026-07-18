import React from "react";
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartProvider } from "@/context/CartContext";
import dynamic from "next/dynamic";
import "./globals.css";

const PostHogProvider = dynamic(() => import("@/components/PostHogProvider"), { ssr: false });
const CookieConsent   = dynamic(() => import("@/components/CookieConsent"),   { ssr: false });

export const metadata: Metadata = {
  metadataBase: new URL("https://srilayafoods.com"),
  title: {
    default: "SriLaYa Naturals — Organic Millets & Traditional Foods",
    template: "%s | SriLaYa Naturals",
  },
  description:
    "Pure, minimally-processed millets, millet flour, rava, flakes, and traditional laddus sourced directly from organic farmers across India. Pan-India delivery.",
  keywords: [
    "organic millets", "buy millets online", "millet flour", "millet rava",
    "millet flakes", "millet rice", "ragi flour", "foxtail millet",
    "organic food India", "millet laddu", "SriLaYa Naturals",
  ],
  authors: [{ name: "SriLaYa Naturals" }],
  creator: "SriLaYa Naturals",
  openGraph: {
    siteName: "SriLaYa Naturals",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/brand/srilaya-logo.png", width: 512, height: 512, alt: "SriLaYa Naturals" }],
  },
  twitter: {
    card: "summary",
    title: "SriLaYa Naturals — Organic Millets & Traditional Foods",
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
        <PostHogProvider>
          <CartProvider>{children}</CartProvider>
          <SpeedInsights />
          <CookieConsent />
        </PostHogProvider>
      </body>
    </html>
  );
}