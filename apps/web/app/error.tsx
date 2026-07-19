"use client";

import { useEffect } from "react";
import Link from "next/link";

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
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[#212121] mb-3">Something went wrong</h1>
        <p className="text-[#9E9E9E] mb-8 text-sm leading-relaxed">
          An unexpected error occurred. Please try again, or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#006A38] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#00522B] transition-colors text-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border border-[#006A38] text-[#006A38] font-bold px-6 py-3 rounded-xl hover:bg-[#e8f5ee] transition-colors text-sm"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
