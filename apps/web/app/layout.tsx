import React from 'react';
import './globals.css'; 
import Header from "../components/Header";

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