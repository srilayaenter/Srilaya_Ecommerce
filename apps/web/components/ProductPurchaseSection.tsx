"use client";

import { useState } from "react";
import ProductGallery from "@/components/ProductGallery";
import AddToCartWithDropdown from "@/components/AddToCartWithDropdown";
import NotifyMeButton from "@/components/NotifyMeButton";

interface Variant {
  id: string;
  size: string;
  price: number;
  stock: number;
  imageUrl: string | null;
}

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Props {
  variants: Variant[];
  images: GalleryImage[];
  fallback: string | null;
  title: string;
}

export default function ProductPurchaseSection({ variants, images, fallback, title }: Props) {
  const [activeVariantId, setActiveVariantId] = useState(variants[0]?.id ?? "");

  const activeVariant = variants.find(v => v.id === activeVariantId);

  // If the selected variant has its own image, prepend it to the gallery
  const galleryImages: GalleryImage[] = activeVariant?.imageUrl
    ? [{ id: `variant-${activeVariant.id}`, url: activeVariant.imageUrl, alt: `${title} — ${activeVariant.size}` }, ...images]
    : images;

  const inStock = variants.some(v => v.stock > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
      {/* Left — image gallery reacts to variant selection */}
      <div className="md:sticky md:top-28">
        <ProductGallery images={galleryImages} fallback={fallback} title={title} />
      </div>

      {/* Right — details passed up from parent via slots */}
      <div id="purchase-section" className="space-y-0">
        {/* Variant selector + add to cart */}
        <div className="bg-white border border-[#E0E0E0] rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-base mb-4 text-[#212121]">Select Size & Add to Cart</h2>
          {variants.length > 0 ? (
            <>
              <AddToCartWithDropdown
                variants={variants}
                onVariantChange={setActiveVariantId}
              />
              {!inStock && (
                <div className="mt-4">
                  <NotifyMeButton variantId={variants[0].id} />
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic text-sm">No variants configured for this product.</p>
          )}
        </div>
      </div>
    </div>
  );
}
