import React from 'react';
import './globals.css'; 
import Header from "../components/Header";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import { revalidatePath } from "next/cache";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}