"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "foxtail",
    name: "Parboiled Foxtail",
    keyword: "parboiled foxtail",
    emoji: "🌾",
    local: "Parboiled Navane / Thinai",
    badge: "Energy Booster",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    accentLight: "#FFFBEB",
    tags: ["heart", "diabetic"],
    benefits: [
      { label: "Low Glycemic Index", desc: "Parboiling lowers GI further — ideal for diabetics" },
      { label: "Cardiac Care", desc: "Natural sterols support healthy heart function" },
      { label: "Energy Booster", desc: "Enhanced nutrient retention for sustained vitality" },
    ],
  },
  {
    id: "finger",
    name: "Parboiled Finger Millets (Ragi)",
    keyword: "parboiled finger",
    emoji: "🌿",
    local: "Parboiled Ragi / Kezhvaragu",
    badge: "Calcium Rich",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    accent: "#5C3A21",
    accentLight: "#FDF0E8",
    tags: ["family", "bone"],
    benefits: [
      { label: "Highest Calcium", desc: "Parboiling increases calcium bioavailability significantly" },
      { label: "Boosts Haemoglobin", desc: "Enhanced iron absorption supports blood health" },
      { label: "Relaxation Support", desc: "Tryptophan retained through gentle parboiling" },
    ],
  },
  {
    id: "little",
    name: "Parboiled Little Millet",
    keyword: "parboiled little",
    emoji: "🌱",
    local: "Parboiled Samai / Kutki",
    badge: "Antioxidant Rich",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    accentLight: "#ECFDF5",
    tags: ["heart", "digestive"],
    benefits: [
      { label: "High Antioxidants", desc: "Parboiling concentrates phenolic antioxidant compounds" },
      { label: "Digestive Health", desc: "Easier to digest than raw grain — great for sensitive stomachs" },
      { label: "Weight Management", desc: "High fibre content promotes satiety and healthy weight" },
    ],
  },
  {
    id: "barnyard",
    name: "Parboiled Barnyard Grains",
    keyword: "parboiled barnyard",
    emoji: "🍃",
    local: "Parboiled Kuthiraivali / Sanwa",
    badge: "Immune Boost",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    accentLight: "#FFF7ED",
    tags: ["diabetic", "digestive"],
    benefits: [
      { label: "Low Glycemic Index", desc: "Parboiling creates resistant starch — even slower glucose release" },
      { label: "Anti-Inflammatory", desc: "Retained polyphenols reduce systemic inflammation" },
      { label: "Immune Boost", desc: "Enhanced mineral retention strengthens immunity" },
    ],
  },
  {
    id: "kodo",
    name: "Parboiled Kodo",
    keyword: "parboiled kodo",
    emoji: "🟤",
    local: "Parboiled Varagu / Kodra",
    badge: "Diabetic Care",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    accent: "#6d28d9",
    accentLight: "#F5F3FF",
    tags: ["diabetic", "heart"],
    benefits: [
      { label: "Reliable Diabetic Control", desc: "Consistently lowers blood glucose levels post-meal" },
      { label: "Body Protection", desc: "Antioxidants guard cells from oxidative damage" },
      { label: "High Fiber", desc: "Resistant starch from parboiling feeds gut health" },
    ],
  },
  {
    id: "pearl",
    name: "Parboiled Pearl",
    keyword: "parboiled pearl",
    emoji: "✨",
    local: "Parboiled Bajra / Kambu",
    badge: "Brain Health",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#b45309",
    accentLight: "#FEF3C7",
    tags: ["family", "heart"],
    benefits: [
      { label: "Protein Power", desc: "Parboiling improves protein digestibility and absorption" },
      { label: "Brain Health Support", desc: "Essential phosphorus and B-vitamins nourish neural function" },
      { label: "Healthy Pregnancy", desc: "Bioavailable folate — crucial for foetal development" },
    ],
  },
  {
    id: "red-sorghum",
    name: "Parboiled Red Sorghum",
    keyword: "parboiled red sorghum",
    emoji: "🔴",
    local: "Parboiled Jowar / Cholam",
    badge: "Gut Health",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "#9f1239",
    accentLight: "#FFF1F2",
    tags: ["heart", "digestive"],
    benefits: [
      { label: "Excellent Digestibility", desc: "Parboiling gelatinises starch for easier digestion" },
      { label: "Sustain Energy", desc: "Slow-release carbohydrates for all-day stamina" },
      { label: "Sustainable Source", desc: "Drought-resistant crop — environmentally responsible choice" },
    ],
  },
  {
    id: "white-sorghum",
    name: "Parboiled White Sorghum",
    keyword: "parboiled white sorghum",
    emoji: "🌻",
    local: "Parboiled White Jowar / Cholam",
    badge: "Complete Protein",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#d97706",
    accentLight: "#FFFBEB",
    tags: ["family", "bone"],
    wide: true,
    benefits: [
      { label: "Complete Protein", desc: "All essential amino acids — rare in a single grain source" },
      { label: "Uniform Cooking", desc: "Parboiling ensures every grain cooks evenly — no mushy texture" },
      { label: "Anti-Cancer Research", desc: "Polyphenols under active study for cancer prevention properties" },
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
type ParboiledMilletsPageClientProps = { productImageMap?: ImageMap };

export default function ParboiledMilletsPageClient({ productImageMap = {} }: ParboiledMilletsPageClientProps) {
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
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Parboiled Millet collection. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900/8 via-amber-50/30 to-[#FDFBF7] py-16 md:py-24 border-b border-blue-900/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(#1e40af 0.75px, transparent 0.75px), radial-gradient(#1e40af 0.75px, #fdfbf7 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/10 text-blue-900 font-bold text-xs uppercase tracking-wider mb-6 border border-blue-900/20">
            💧 Parboiled Millet Collection
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-blue-950 leading-tight max-w-4xl mx-auto mb-4">
            The Parboiled<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              Powerhouse.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s signature{" "}
            <strong className="text-blue-900">Parboiled Millet collection</strong> — 8 varieties
            processed through traditional Soak → Steam → Dry → Mill to lock in more nutrition than raw grain.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a href="#collection" className="bg-blue-900 hover:bg-[#2E6F40] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
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
              ["Enhanced Nutrients", "More Than Raw"],
              ["Better Digestibility", "Easier on Stomach"],
              ["Extended Shelf Life", "Naturally Preserved"],
              ["Uniform Cooking", "Perfect Texture Every Time"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 bg-white/80 rounded-lg border border-blue-200/60 text-center shadow-sm">
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
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-blue-950">Our Parboiled Millet Collection</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              The same 8 millet varieties — but parboiled for enhanced nutrition, improved digestibility, and a longer shelf life.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeFilter === f.key
                      ? "bg-blue-900 text-white border-blue-900"
                      : "bg-white text-gray-600 border-blue-200 hover:bg-blue-50"
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
                  className={`bg-white/90 backdrop-blur-sm border border-blue-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
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
                      <span className="text-6xl">{p.emoji}</span>
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
                      💬 Enquire on WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* What is parboiling */}
        <section className="bg-gradient-to-r from-blue-950 to-[#2E6F40] text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">The Science</span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">What Is Parboiling?</h2>
            <p className="text-blue-100 mt-2 text-sm">A 3-step traditional process that pushes nutrients from the bran into the grain — so they survive cooking.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "💧", step: "Step 1", title: "Soak", desc: "Raw millet soaked in water to begin hydration and activate natural enzymes." },
              { icon: "♨️", step: "Step 2", title: "Steam", desc: "Steam-pressure drives water-soluble nutrients from the bran deep into the grain." },
              { icon: "☀️", step: "Step 3", title: "Dry", desc: "Sun-dried or hot-air dried until moisture drops to safe storage levels." },
              { icon: "⚙️", step: "Step 4", title: "Mill", desc: "Lightly dehusked — bran layer mostly intact, nutrients locked in place." },
            ].map((b) => (
              <div key={b.title} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 text-center hover:bg-white/20 transition-all duration-300">
                <div className="text-xs font-bold text-[#D99B26] uppercase tracking-widest mb-2">{b.step}</div>
                <div className="w-14 h-14 bg-[#D99B26] text-[#5C3A21] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow">{b.icon}</div>
                <h3 className="font-bold text-base mb-1">{b.title}</h3>
                <p className="text-xs text-blue-100">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              ["Enhanced Nutrient Retention", "More vitamins survive cooking"],
              ["Improved Digestibility", "Pre-gelatinised starch is easier to digest"],
              ["Extended Shelf Life", "Lower moisture = longer freshness"],
              ["Uniform Cooking", "Grains cook evenly with no clumping"],
            ].map(([title, sub]) => (
              <div key={title} className="bg-white/10 rounded-xl px-4 py-3 border border-white/15">
                <div className="font-bold text-sm text-[#D99B26]">{title}</div>
                <div className="text-xs text-blue-200 mt-1">{sub}</div>
              </div>
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
