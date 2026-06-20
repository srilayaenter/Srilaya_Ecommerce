import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import { BRAND } from "../lib/brand";
import Providers from "./providers";

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
  icons: {
    icon: "/brand/srilaya-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}