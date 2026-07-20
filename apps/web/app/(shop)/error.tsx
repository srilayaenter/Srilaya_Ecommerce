"use client";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-6">We had trouble loading this page. Please try again.</p>
      <button
        onClick={reset}
        className="px-5 py-2 bg-[#006A38] text-white rounded-lg text-sm font-medium hover:bg-[#005a30]"
      >
        Try again
      </button>
    </main>
  );
}
