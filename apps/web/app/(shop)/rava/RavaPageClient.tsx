"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const PHONE = "918660321315";

// keyword: matched (case-insensitive) against DB product titles to pull the image.
// If no match is found the emoji fallback is shown — no crash.
const PRODUCTS = [
  {
    id: "foxtail",
    name: "Foxtail Rava",
    keyword: "foxtail",
    emoji: "🌾",
    local: "Navane / Thinai / Kangni",
    badge: "Top Seller",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    tags: ["diabetic", "heart"],
    benefits: [
      { label: "Low Glycemic Index", desc: "Helps regulate blood sugar" },
      { label: "Good for Diabetics", desc: "Slow glucose release" },
      { label: "High Fiber Content", desc: "Aids weight management" },
    ],
  },
  {
    id: "finger",
    name: "Finger Rava",
    keyword: "finger",
    emoji: "🌿",
    local: "Ragi Rava / Kezhvaragu",
    badge: "Calcium Rich",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    accent: "#5C3A21",
    tags: ["family"],
    benefits: [
      { label: "Highest Calcium Content", desc: "Stronger bones & teeth" },
      { label: "Natural Relaxant", desc: "Calms nerves & improves sleep" },
      { label: "Essential for Growing Kids", desc: "Complete nourishment" },
    ],
  },
  {
    id: "little",
    name: "Little Rava",
    keyword: "little",
    emoji: "🌱",
    local: "Same Rava / Samai / Kutki",
    badge: "Digestive Care",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    tags: ["heart"],
    benefits: [
      { label: "Antioxidant Rich", desc: "Fights free radical damage" },
      { label: "Gentle on Digestion", desc: "Easy stomach absorption" },
      { label: "Excellent for Respiratory Health", desc: "Soothing properties" },
    ],
  },
  {
    id: "barnyard",
    name: "Barnyard Rava",
    keyword: "barnyard",
    emoji: "🌾",
    local: "Oudalu / Sanwa / Kuthiraivali",
    badge: "Quick Meal",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    tags: ["diabetic", "heart"],
    benefits: [
      { label: "Fast to Cook", desc: "Ready in minutes" },
      { label: "Supports Weight Management", desc: "High satiety" },
      { label: "Good for Heart Health", desc: "Low lipid absorption" },
    ],
  },
  {
    id: "sorghum",
    name: "White Sorghum Rava",
    keyword: "sorghum",
    emoji: "🌻",
    local: "Jowar Rava / Cholam",
    badge: "Energy Boost",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-300",
    accent: "#d97706",
    tags: ["heart", "family"],
    benefits: [
      { label: "Heart Healthy", desc: "Natural plant sterols" },
      { label: "Promotes Strong Bones", desc: "Loaded with Magnesium" },
      { label: "Sustainable Energy Source", desc: "Long-lasting stamina" },
    ],
  },
  {
    id: "pearl",
    name: "Pearl Rava",
    keyword: "pearl",
    emoji: "✨",
    local: "Bajra Rava / Sajje / Kambu",
    badge: "Vitality",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#b45309",
    tags: ["heart"],
    benefits: [
      { label: "Metabolic Booster", desc: "Ignites daily metabolism" },
      { label: "Enhanced Vitality", desc: "High Iron & mineral core" },
      { label: "Heart Protective", desc: "Potassium rich" },
    ],
  },
  {
    id: "mapillai",
    name: "Mapillai Samba Rava",
    keyword: "mapillai",
    emoji: "🏺",
    local: "Traditional Heritage Red Rice Rava",
    badge: "Heritage Grain",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
    accent: "#b91c1c",
    tags: ["family", "heart"],
    wide: true,
    benefits: [
      { label: "Rich in Vitamins", desc: "High B-complex vitamins & micronutrients" },
      { label: "Strengthens Immunity", desc: "Natural antioxidants & defense boosters" },
      { label: "Heritage Vitality", desc: "Traditionally consumed for stamina & endurance" },
    ],
  },
];


const FILTER_OPTIONS = [
  { key: "all", label: "All Varieties" },
  { key: "diabetic", label: "Diabetic Care" },
  { key: "heart", label: "Heart & Vitality" },
  { key: "family", label: "Kids & Family" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

type RavaPageClientProps = {
  productImageMap?: ImageMap;
};

// productImageMap: { "foxtail millet rava": "https://..." } — keys are DB product titles (lowercased)
// Built in the server component (page.tsx) from the millet-rava category query.
export default function RavaPageClient({ productImageMap = {} }: RavaPageClientProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Find image URL for a product card by matching keyword against DB product titles
  function getProductImage(keyword: string): string | null {
    const entry = Object.entries(productImageMap).find(([title]) =>
      title.includes(keyword.toLowerCase())
    );
    return entry ? entry[1] : null;
  }

  const visibleProducts =
    activeFilter === "all"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.tags.includes(activeFilter));

  function openWhatsApp(product?: WhatsAppProduct) {
    const msg = product
      ? `Hello SriLaYa Naturals,\n\nI'm interested in ${product.name}. Could you share pricing and availability? Thank you!`
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Millet Rava collection. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">


      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-100/70 via-amber-50/40 to-[#FDFBF7] py-16 md:py-24 border-b border-amber-200/50">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(#d99b26 0.75px, transparent 0.75px), radial-gradient(#d99b26 0.75px, #fdfbf7 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D99B26]/15 text-[#5C3A21] font-bold text-xs uppercase tracking-wider mb-6 border border-[#D99B26]/30">
            🌾 Premium Healthy Grains
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            Nature&apos;s Granular Gems:<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              The Rava Revolution
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s signature <strong className="text-[#5C3A21]">Millet Rava collection</strong> — nutrient-dense,
            fiber-rich, and crafted for everyday vitality.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="#collection"
              className="bg-[#5C3A21] hover:bg-[#2E6F40] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              🛒 Explore Collection
            </a>
            <button
              onClick={() => openWhatsApp()}
              className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-8 py-3.5 rounded-xl text-base shadow-md transition-all duration-300 flex items-center gap-2"
            >
              💬 Chat on WhatsApp
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              ["100% Natural", "Zero Additives"],
              ["Low GI", "Diabetic Friendly"],
              ["High Fiber", "Satiety & Gut Care"],
              ["Traditional", "Authentic Taste"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 bg-white/80 rounded-lg border border-amber-200/60 text-center shadow-sm">
                <div className="text-[#2E6F40] font-bold text-sm">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">

        {/* Product Collection */}
        <section id="collection" className="scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#5C3A21]">
              Our Signature Rava Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              Discover the distinct wellness benefits and rich textures of our 7 nutrient-packed millet varieties.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeFilter === f.key
                      ? "bg-[#5C3A21] text-white border-[#5C3A21]"
                      : "bg-white text-gray-600 border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProducts.map((p) => {
              const imgUrl = getProductImage(p.keyword);
              return (
              <div
                key={p.id}
                className={`bg-white/90 backdrop-blur-sm border border-[#D99B26]/15 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  p.wide ? "lg:col-span-3 md:col-span-2" : ""
                }`}
                style={{ borderTop: `4px solid ${p.accent}` }}
              >
                {/* Product image or emoji fallback */}
                {imgUrl ? (
                  <div className="relative h-44 w-full bg-[#F5F5F5]">
                    <Image src={imgUrl} alt={p.name} fill className="object-cover" unoptimized />
                    <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center relative">
                    <span className="text-5xl">{p.emoji}</span>
                    <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div>
                  <h3 className="font-serif text-2xl font-bold text-[#5C3A21] mb-1">{p.name}</h3>
                  <p className="text-xs font-semibold text-[#2E6F40] uppercase tracking-wider mb-4">{p.local}</p>

                  {p.wide ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      {p.benefits.map((b) => (
                        <div key={b.label} className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                          <div className="font-bold text-[#5C3A21] text-sm mb-1">✦ {b.label}</div>
                          <div className="text-xs text-gray-500">{b.desc}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2 text-sm text-gray-700 mb-6">
                      {p.benefits.map((b) => (
                        <li key={b.label} className="flex items-start gap-2">
                          <span className="text-[#2E6F40] mt-0.5 text-xs">✔</span>
                          <span><strong>{b.label}</strong> — {b.desc}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  </div>

                  <button
                    onClick={() => openWhatsApp(p)}
                    className="w-full py-2.5 bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white text-[#1a9e4a] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-[#25D366]/40 mt-2"
                  >
                    💬 Enquire on WhatsApp
                  </button>
                </div>
              </div>
            )})}
          </div>
        </section>

        {/* Health Benefits */}
        <section
          id="benefits"
          className="scroll-mt-24 bg-gradient-to-r from-[#2E6F40] to-emerald-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Wellness First
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              Why Millet Rava?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              Why switching from refined rava to SriLaYa Millet Rava is the best decision for your kitchen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: "📉", title: "Low GI Index", desc: "Sustained blood sugar regulation with zero sudden spikes." },
              { icon: "🦠", title: "Gut Health", desc: "Abundant prebiotic dietary fiber that improves digestion." },
              { icon: "🔋", title: "Satiety Booster", desc: "Keeps you full longer, reducing cravings and overeating." },
              { icon: "🌿", title: "Traditional Purity", desc: "100% unpolished whole grains carefully granulated." },
              { icon: "⏱️", title: "Fast Cooking", desc: "Cooks easily in under 10–12 minutes without clumping." },
            ].map((b) => (
              <div
                key={b.title}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 text-center hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#D99B26] text-[#5C3A21] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow">
                  {b.icon}
                </div>
                <h3 className="font-bold text-base mb-1">{b.title}</h3>
                <p className="text-xs text-amber-100">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recipes teaser */}
        <section className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Looking for recipe ideas?{" "}
            <Link href="/recipes" className="text-[#2E6F40] font-semibold hover:underline">
              Browse millet recipes →
            </Link>
          </p>
        </section>

      </main>

      {/* Floating WhatsApp button */}
      <button
        onClick={() => openWhatsApp()}
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-5 py-3.5 rounded-full shadow-2xl hover:shadow-[0_8px_30px_rgba(37,211,102,0.5)] transition-all duration-300 group"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm">Chat on WhatsApp</span>
      </button>
    </div>
  );
}
