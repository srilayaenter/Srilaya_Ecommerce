import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty Points",
  description: "Check your SriLaYa Naturals loyalty points balance and learn how to earn more.",
  robots: { index: false },
};

export default function LoyaltyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
