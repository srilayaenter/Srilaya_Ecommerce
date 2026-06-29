"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
}

export default function ProductGallery({
  images,
  fallback,
  title,
}: {
  images: GalleryImage[];
  fallback: string | null;
  title: string;
}) {
  const allImages: GalleryImage[] = images.length > 0
    ? images
    : fallback
      ? [{ id: "fallback", url: fallback, alt: title }]
      : [{ id: "placeholder", url: `https://placehold.co/600x600/006A38/white?text=${encodeURIComponent(title)}`, alt: title }];

  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#F5F5F5] border border-[#E0E0E0] shadow-sm">
        <Image
          key={allImages[active].url}
          src={allImages[active].url}
          alt={allImages[active].alt ?? title}
          fill
          priority
          className="object-contain p-6 transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={allImages[active].url.startsWith("http") && !allImages[active].url.includes("placehold")}
        />

        {/* Nav arrows — only when >1 image */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => (i - 1 + allImages.length) % allImages.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-[#424242] transition-all"
              aria-label="Previous image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => setActive(i => (i + 1) % allImages.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-[#424242] transition-all"
              aria-label="Next image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-[#006A38] w-4" : "bg-[#006A38]/30"}`}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails — only when >1 image */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-[#006A38] shadow-md"
                  : "border-[#E0E0E0] hover:border-[#006A38]/40"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${title} ${i + 1}`}
                fill
                className="object-contain p-1.5"
                sizes="64px"
                unoptimized={img.url.startsWith("http")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
