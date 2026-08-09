"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grains, ShoppingCart, TrendDown, Microscope, Leaf , WhatsappLogo } from "@phosphor-icons/react";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "foxtail",
    name: "Foxtail Millet Grains",
    keyword: "foxtail millet grain",
    local: "Navane / Thinai / Kangni",
    badge: "Heart Healthy",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    accentLight: "#FFFBEB",
    tags: ["heart", "diabetic"],
    benefits: [
      { label: "Heart Health", desc: "Natural plant sterols reduce bad cholesterol" },
      { label: "Nerve Function Support", desc: "B-vitamins nourish the nervous system" },
      { label: "Energy Booster", desc: "Slow-release carbs for sustained daily energy" },
    ],
  },
  {
    id: "finger",
    name: "Finger Millet Grains (Ragi)",
    keyword: "finger millet grain",
    local: "Ragi / Kezhvaragu / Nachni",
    badge: "Calcium Rich",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    accent: "#5C3A21",
    accentLight: "#FDF0E8",
    tags: ["family", "bone"],
    benefits: [
      { label: "Highest Calcium Content", desc: "Stronger bones, teeth, and joints for all ages" },
      { label: "Boosts Haemoglobin", desc: "Iron-rich grain ideal for anaemia prevention" },
      { label: "Promotes Relaxation", desc: "Tryptophan calms nerves and aids restful sleep" },
    ],
  },
  {
    id: "little",
    name: "Little Millet Grains",
    keyword: "little millet grain",
    local: "Samai / Same / Kutki",
    badge: "Digestive Care",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    accentLight: "#ECFDF5",
    tags: ["heart", "digestive"],
    benefits: [
      { label: "High in Antioxidants", desc: "Fights free radical damage and cellular ageing" },
      { label: "Respiratory Benefits", desc: "Traditional use for soothing respiratory health" },
      { label: "Digestive Wellness", desc: "High fibre content for smooth digestion" },
    ],
  },
  {
    id: "barnyard",
    name: "Barnyard Millet Grains",
    keyword: "barnyard millet grain",
    local: "Kuthiraivali / Sanwa / Oudalu",
    badge: "Low GI",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    accentLight: "#FFF7ED",
    tags: ["diabetic", "digestive"],
    benefits: [
      { label: "Low Glycemic Index", desc: "Ideal for diabetics and blood sugar management" },
      { label: "Prebiotic Properties", desc: "Feeds beneficial gut bacteria for microbiome health" },
      { label: "Weight Management", desc: "High satiety value reduces overall calorie intake" },
    ],
  },
  {
    id: "kodo",
    name: "Kodo Millet Grains",
    keyword: "kodo millet grain",
    local: "Varagu / Kodra / Arikelu",
    badge: "Diabetic Friendly",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    accent: "#6d28d9",
    accentLight: "#F5F3FF",
    tags: ["diabetic", "heart"],
    benefits: [
      { label: "Fiber Rich", desc: "Excellent for digestive health and natural detox" },
      { label: "Diabetes Control", desc: "Proven to lower blood glucose and insulin response" },
      { label: "Body Cell Protection", desc: "Antioxidants guard against cellular damage" },
    ],
  },
  {
    id: "pearl",
    name: "Pearl Millet Grains (Bajra)",
    keyword: "pearl millet grain",
    local: "Bajra / Kambu / Sajje",
    badge: "High Protein",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#b45309",
    accentLight: "#FEF3C7",
    tags: ["family", "heart"],
    benefits: [
      { label: "High Protein", desc: "Superior amino acid profile for growth and repair" },
      { label: "Brain Health Support", desc: "Phosphorus and essential fats nourish the brain" },
      { label: "Healthy Pregnancy", desc: "Folate-rich grain essential for expecting mothers" },
    ],
  },
  {
    id: "red-sorghum",
    name: "Red Sorghum Grains (Jowar)",
    keyword: "red sorghum grain",
    local: "Jonna / Cholam / Jowar",
    badge: "Gut Health",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "#9f1239",
    accentLight: "#FFF1F2",
    tags: ["heart", "digestive"],
    benefits: [
      { label: "Gut Health", desc: "Promotes healthy gut flora with natural prebiotic action" },
      { label: "Reduces Oxidative Stress", desc: "Rich in polyphenols — powerful antioxidant defence" },
      { label: "Sustainable Energy", desc: "Complex carbs for hours of stable energy" },
    ],
  },
  {
    id: "white-sorghum",
    name: "White Sorghum Grains (Jowar)",
    keyword: "white sorghum grain",
    local: "White Jowar / Cholam / Jonnalu",
    badge: "Gluten-Free",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#d97706",
    accentLight: "#FFFBEB",
    tags: ["family", "bone"],
    wide: true,
    benefits: [
      { label: "Complete Protein", desc: "All essential amino acids in a single whole grain" },
      { label: "Bone Strength", desc: "Magnesium and phosphorus for strong skeletal health" },
      { label: "Gluten-Free Alternative", desc: "Safe for gluten intolerance — a versatile wheat substitute" },
    ],
  },
];

const FILTER_OPTIONS = [
  { key: "all", label: "All Varieties" },
  { key: "diabetic", label: "Diabetic Care" },
  { key: "heart", label: "Heart Health" },
  { key: "digestive", label: "Digestive Care" },
  { key: "bone", label: "Bone & Calcium" },
  { key: "family", label: "Kids & Family" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };
type RawMilletsPageClientProps = { productImageMap?: ImageMap };

export default function RawMilletsPageClient({ productImageMap = {} }: RawMilletsPageClientProps) {
  const [activeFilter, setActiveFilter] = useState("all");

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
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Whole Millet Grains collection. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900/10 via-amber-50/30 to-[#FDFBF7] py-16 md:py-24 border-b border-emerald-900/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(#2E6F40 0.75px, transparent 0.75px), radial-gradient(#2E6F40 0.75px, #fdfbf7 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/10 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-6 border border-emerald-900/20">
            <Grains className="w-4 h-4" weight="regular" /> Whole Millet Grains
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#2E6F40] leading-tight max-w-4xl mx-auto mb-4">
            Nature&apos;s Supergrains:<br className="hidden sm:block" />
            <span className="text-[#5C3A21] underline decoration-[#D99B26] decoration-wavy decoration-2">
              The Grain Revolution.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s whole{" "}
            <strong className="text-[#2E6F40]">Millet Grain collection</strong> — 8 unpolished varieties,
            each a nutritional powerhouse. Cook as rice, make porridge, or grind fresh into flour.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a href="#collection" className="bg-[#2E6F40] hover:bg-[#5C3A21] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" weight="regular" /> Explore Collection
            </a>
            <button
              onClick={() => openWhatsApp()}
              className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-8 py-3.5 rounded-xl text-base shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <WhatsappLogo size={15} weight="fill" className="inline-block mr-1" />Chat on WhatsApp
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              ["8 Varieties", "One Collection"],
              ["100% Unpolished", "Full Bran Intact"],
              ["Low GI", "Diabetic Friendly"],
              ["Gluten-Free", "Wheat Alternative"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 bg-white/80 rounded-lg border border-emerald-200/60 text-center shadow-sm">
                <div className="text-[#2E6F40] font-bold text-sm">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">

        <section id="collection" className="scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2E6F40]">Our Whole Millet Grain Collection</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              Each grain is cleaned, sun-dried, and packed whole — no polishing, no processing, full nutrition retained.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeFilter === f.key
                      ? "bg-[#2E6F40] text-white border-[#2E6F40]"
                      : "bg-white text-gray-600 border-emerald-200 hover:bg-emerald-50"
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
                  className={`bg-white/90 backdrop-blur-sm border border-emerald-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                    p.wide ? "lg:col-span-3 md:col-span-2" : ""
                  }`}
                  style={{ borderTop: `4px solid ${p.accent}` }}
                >
                  {imgUrl ? (
                    <div className="relative h-44 w-full bg-[#F5F5F5]">
                      <Image src={imgUrl} alt={p.name} fill className="object-cover" unoptimized />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>{p.badge}</span>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center relative" style={{ backgroundColor: p.accentLight }}>
                      <Grains className="w-14 h-14" weight="regular" style={{ color: p.accent }} />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>{p.badge}</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div>
                      <h3 className="font-serif text-xl font-bold mb-1" style={{ color: p.accent }}>{p.name}</h3>
                      <p className="text-xs font-semibold text-[#2E6F40] uppercase tracking-wider mb-4">{p.local}</p>
                      {p.wide ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          {p.benefits.map((b) => (
                            <div key={b.label} className="p-3 rounded-lg border" style={{ backgroundColor: p.accentLight, borderColor: `${p.accent}20` }}>
                              <div className="font-bold text-sm mb-1" style={{ color: p.accent }}>✦ {b.label}</div>
                              <div className="text-xs text-gray-500">{b.desc}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-2 text-sm text-gray-700 mb-6">
                          {p.benefits.map((b) => (
                            <li key={b.label} className="flex items-start gap-2">
                              <span className="mt-0.5 text-xs" style={{ color: p.accent }}>✔</span>
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
                      <WhatsappLogo size={15} weight="fill" className="inline-block mr-1" />Enquire on WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-gradient-to-r from-[#2E6F40] to-emerald-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">Wellness First</span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">Why Whole Millet Grains?</h2>
            <p className="text-emerald-100 mt-2 text-sm">The whole grain is always greater than the sum of its parts — bran, germ, and endosperm working together.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Grains, title: "100% Unpolished", desc: "Full bran and germ retained — all fibre, vitamins, and minerals stay intact." },
              { icon: TrendDown, title: "Low Glycemic Index", desc: "Whole grain structure slows glucose absorption — steady energy, no spikes." },
              { icon: Microscope, title: "Gut Microbiome", desc: "Natural resistant starch and fibre feed your beneficial gut bacteria." },
              { icon: Leaf, title: "Truly Gluten-Free", desc: "All 8 varieties are naturally gluten-free — safe for wheat-sensitive diets." },
            ].map((b) => (
              <div key={b.title} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 text-center hover:bg-white/20 transition-all duration-300">
                <div className="w-14 h-14 bg-[#D99B26] text-[#5C3A21] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow"><b.icon className="w-7 h-7" weight="regular" /></div>
                <h3 className="font-bold text-base mb-1">{b.title}</h3>
                <p className="text-xs text-emerald-100">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Uses */}
        <section className="text-center">
          <h2 className="font-serif text-2xl font-bold text-[#2E6F40] mb-2">What Can You Cook?</h2>
          <p className="text-gray-500 text-sm mb-6">Use whole millet grains anywhere you'd use rice — they cook in a similar way with slightly more water.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Healthy Pulao", "Traditional Roti", "Nutrient-Rich Kheer", "Comforting Khichdi", "Fermented Idli Batter", "Grain Bowls", "Sprouted for Salads"].map((use) => (
              <span key={use} className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-[#2E6F40] font-semibold text-sm rounded-full">{use}</span>
            ))}
          </div>
        </section>

        <section className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Looking for recipe ideas?{" "}
            <Link href="/recipes" className="text-[#2E6F40] font-semibold hover:underline">Browse millet recipes →</Link>
          </p>
        </section>
      </main>

      <button
        onClick={() => openWhatsApp()}
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-5 py-3.5 rounded-full shadow-2xl hover:shadow-[0_8px_30px_rgba(37,211,102,0.5)] transition-all duration-300"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm">Chat on WhatsApp</span>
      </button>
    </div>
  );
}
