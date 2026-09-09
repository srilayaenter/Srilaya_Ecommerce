"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Warning } from "@phosphor-icons/react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="text-center max-w-md">
        <Warning size={52} weight="regular" className="text-[#FF9800] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#212121] mb-3">Something went wrong</h1>
        <p className="text-[#9E9E9E] mb-8 text-sm leading-relaxed">
          An unexpected error occurred. Please try again, or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-naturals-green text-white font-bold px-6 py-3 rounded-xl hover:bg-naturals-green-dark transition-colors text-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-naturals-green text-naturals-green font-bold px-6 py-3 rounded-xl hover:bg-[#e8f5ee] transition-colors text-sm"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
