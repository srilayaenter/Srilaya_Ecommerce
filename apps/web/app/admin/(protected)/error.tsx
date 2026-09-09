"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <h1 className="text-2xl font-bold text-red-600">Admin page error</h1>
      <pre className="bg-gray-100 text-gray-800 rounded p-4 text-sm max-w-2xl w-full overflow-auto whitespace-pre-wrap">
        {error.message}
        {error.digest ? `\nDigest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        className="bg-[#006A38] text-white px-6 py-2 rounded-lg font-bold"
      >
        Try again
      </button>
    </div>
  );
}
