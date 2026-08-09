"use client";

import { useState } from "react";
import Image from "next/image";
import { BowlFood } from "@phosphor-icons/react";

export default function RecipeCardImage({ src, alt, tag }: { src: string; alt: string; tag: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="h-44 bg-gradient-to-br from-[#E8F5E9] to-[#A5D6A7] flex flex-col items-center justify-center gap-2">
        <BowlFood size={52} weight="regular" className="text-[#2E6F40]" />
        <span className="text-xs font-bold text-[#006A38] bg-white/70 px-3 py-0.5 rounded-full">{tag}</span>
      </div>
    );
  }

  return (
    <div className="relative h-44 bg-[#F5F5F5]">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
        onError={() => setErrored(true)}
      />
      <span className="absolute top-3 left-3 text-xs font-bold text-[#006A38] bg-white/90 px-3 py-0.5 rounded-full">{tag}</span>
    </div>
  );
}
