"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "honey",
    name: "Honey Muesli & Granola",
    keyword: "honey muesli",
    emoji: "🍯",
    local: "Whole Grain Oats · Honey · Mixed Nuts",
    badge: "Classic Favourite",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    accentLight: "#FFFBEB",
    tags: ["all-day", "natural-sweet"],
    benefits: [
      { label: "Natural Sweetness", desc: "Real honey — no artificial sweetener, no refined sugar" },
      { label: "Fibre-Powered Energy", desc: "Whole grain base keeps you full through the morning" },
      { label: "Promotes Digestion", desc: "Prebiotic fibres support a healthy gut microbiome" },
    ],
  },
  {
    id: "chocolate",
    name: "Chocolate Muesli",
    keyword: "chocolate muesli",
    emoji: "🍫",
    local: "Whole Grain · Dark Cocoa · Antioxidants",
    badge: "Indulgent & Healthy",
    badgeColor: "bg-stone-100 text-stone-900 border-stone-300",
    accent: "#44211a",
    accentLight: "#FDF8F6",
    tags: ["all-day", "antioxidant"],
    benefits: [
      { label: "Indulgent Cocoa Rush", desc: "Real dark cocoa — guilt-free chocolate for breakfast" },
      { label: "Loaded with Antioxidants", desc: "Cocoa polyphenols fight free radical damage" },
      { label: "Boosts Serotonin Naturally", desc: "Dark chocolate compounds elevate mood and focus" },
    ],
  },
  {
    id: "strawberry",
    name: "Strawberry Muesli",
    keyword: "strawberry muesli",
    emoji: "🍓",
    local: "Whole Grain · Dehydrated Strawberry · Oats",
    badge: "Heart Friendly",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-200",
    accent: "#be123c",
    accentLight: "#FFF1F2",
    tags: ["antioxidant", "natural-sweet"],
    benefits: [
      { label: "Berry Good for Hearts", desc: "Strawberry flavonoids support cardiovascular health" },
      { label: "Antioxidant Haven", desc: "Vitamin C and ellagic acid from real fruit pieces" },
      { label: "Low Fat & Fibre Rich", desc: "Light on calories, heavy on nutrition" },
    ],
  },
  {
    id: "nutty",
    name: "Nutty Granola",
    keyword: "nutty granola",
    emoji: "🥜",
    local: "Mixed Nuts · Seeds · Whole Grain Clusters",
    badge: "High Protein",
    badgeColor: "bg-orange-100 text-orange-900 border-orange-200",
    accent: "#c2410c",
    accentLight: "#FFF7ED",
    tags: ["protein", "all-day"],
    benefits: [
      { label: "Protein-Packed Nut Mix", desc: "Almonds, cashews, and seeds for muscle nourishment" },
      { label: "Sustained Energy", desc: "Slow-release healthy fats keep energy levels steady" },
      { label: "Good Fats & Omega-3s", desc: "Walnuts and flaxseed deliver essential fatty acids" },
    ],
  },
  {
    id: "fruits",
    name: "Fruits Granola",
    keyword: "fruits granola",
    emoji: "🍇",
    local: "Whole Grain · Mixed Dried Fruits · Oats",
    badge: "Nutrient Dense",
    badgeColor: "bg-violet-100 text-violet-900 border-violet-200",
    accent: "#7c3aed",
    accentLight: "#F5F3FF",
    tags: ["antioxidant", "natural-sweet"],
    benefits: [
      { label: "Fibre-Packed", desc: "Dried fruits add natural fibre for gut and heart health" },
      { label: "Nutrient Dense", desc: "Vitamins and minerals from a variety of real fruits" },
      { label: "Natural Sweetness", desc: "Real dehydrated fruit — no added colour or flavour" },
    ],
  },
  {
    id: "mixed-fruits-nuts",
    name: "Mixed Fruits & Nuts",
    keyword: "mixed fruits",
    emoji: "🌰",
    local: "Dried Fruits · Premium Nuts · Seeds",
    badge: "Complete Meal",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
    accent: "#065f46",
    accentLight: "#ECFDF5",
    tags: ["protein", "all-day"],
    benefits: [
      { label: "A Complete Meal", desc: "Balanced carbs, protein, and fats in every handful" },
      { label: "Good Fats", desc: "Nuts deliver heart-healthy monounsaturated fats" },
      { label: "Long-Lasting Fullness", desc: "Protein and fibre combination curbs mid-morning hunger" },
    ],
  },
  {
    id: "sugar-free",
    name: "Sugar Free Muesli",
    keyword: "sugar free muesli",
    emoji: "🩺",
    local: "Whole Grain · No Sugar · Diabetic Safe",
    badge: "Diabetic Friendly",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-200",
    accent: "#1e40af",
    accentLight: "#EFF6FF",
    tags: ["diabetic", "protein"],
    benefits: [
      { label: "Diabetic Friendly", desc: "Zero added sugar — safe for blood sugar management" },
      { label: "Blood Sugar Stable", desc: "Low GI whole grains prevent glucose spikes" },
      { label: "High Satiety", desc: "Fibre and protein keep hunger at bay without sugar" },
    ],
  },
  {
    id: "stevia",
    name: "Sugar Free Stevia Muesli",
    keyword: "stevia muesli",
    emoji: "🌿",
    local: "Whole Grain · Stevia Leaf · Zero Sugar",
    badge: "Zero Calories",
    badgeColor: "bg-teal-100 text-teal-900 border-teal-200",
    accent: "#0f766e",
    accentLight: "#F0FDFA",
    tags: ["diabetic", "natural-sweet"],
    wide: true,
    benefits: [
      { label: "Zero-Sugar Sweetness", desc: "Stevia leaf extract — plant-based, no aftertaste" },
      { label: "Calorie Controlled", desc: "Ideal for weight management without sacrificing taste" },
      { label: "Diabetic & Keto Safe", desc: "Zero glycemic impact — suits most therapeutic diets" },
    ],
  },
];

const FILTER_OPTIONS = [
  { key: "all", label: "All Varieties" },
  { key: "diabetic", label: "Diabetic Friendly" },
  { key: "protein", label: "High Protein" },
  { key: "antioxidant", label: "Antioxidant Rich" },
  { key: "natural-sweet", label: "Naturally Sweet" },
  { key: "all-day", label: "All-Day Energy" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

type MuesliPageClientProps = {
  productImageMap?: ImageMap;
};

export default function MuesliPageClient({ productImageMap = {} }: MuesliPageClientProps) {
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
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Muesli & Granola collection. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-100/60 via-orange-50/30 to-[#FDFBF7] py-16 md:py-24 border-b border-amber-200/50">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(#D99B26 0.75px, transparent 0.75px), radial-gradient(#D99B26 0.75px, #fdfbf7 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 text-amber-900 font-bold text-xs uppercase tracking-wider mb-6 border border-amber-400/30">
            🥣 Ready-to-Eat Muesli & Granola
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            Wake Up to<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              Whole Grains.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s signature{" "}
            <strong className="text-[#5C3A21]">Muesli & Granola collection</strong> — 8 varieties,
            whole grain toasted, naturally preserved. A modern take on ancient grain goodness.
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
              ["8 Varieties", "One Collection"],
              ["No Preservatives", "Shelf-Stable Natural"],
              ["Whole Grain", "Real Fruit & Nuts"],
              ["Ready in Seconds", "Just Add Milk"],
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
              Our Muesli & Granola Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              From indulgent chocolate to diabetic-safe stevia — 8 varieties for every taste, every health goal, every morning.
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
                  className={`bg-white/90 backdrop-blur-sm border border-amber-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                    p.wide ? "lg:col-span-3 md:col-span-2" : ""
                  }`}
                  style={{ borderTop: `4px solid ${p.accent}` }}
                >
                  {imgUrl ? (
                    <div className="relative h-44 w-full bg-[#F5F5F5]">
                      <Image src={imgUrl} alt={p.name} fill className="object-cover" unoptimized />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="h-44 flex items-center justify-center relative"
                      style={{ backgroundColor: p.accentLight }}
                    >
                      <span className="text-6xl">{p.emoji}</span>
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <div>
                      <h3 className="font-serif text-xl font-bold mb-1" style={{ color: p.accent }}>
                        {p.name}
                      </h3>
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

        {/* Why Muesli & Granola */}
        <section className="bg-gradient-to-r from-amber-900 to-[#2E6F40] text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Wellness First
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              Why SriLaYa Muesli?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              Not all mueslis are equal. Ours starts with whole grain toasting and ends with real ingredients — no shortcuts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "🌾", title: "Whole Grain Toasted", desc: "Each batch slow-toasted to preserve nutrients and develop natural flavour." },
              { icon: "🍑", title: "Real Fruit Dehydration", desc: "Actual fruit pieces, gently dehydrated — not artificial flavour or colour." },
              { icon: "🍃", title: "Natural Sweetening", desc: "Honey, stevia, or unsweetened — never refined sugar or corn syrup." },
              { icon: "📦", title: "Extended Shelf Life", desc: "Naturally preserved through toasting — no artificial preservatives needed." },
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

        {/* How to enjoy */}
        <section className="text-center">
          <h2 className="font-serif text-2xl font-bold text-[#5C3A21] mb-2">How to Enjoy</h2>
          <p className="text-gray-500 text-sm mb-6">Soak overnight for a soft texture or eat straight from the pack for a crunchy bite.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["With Cold Milk", "With Warm Milk", "With Curd & Honey", "As a Dry Snack", "With Fresh Fruits", "Overnight Oats Style", "Post-Workout Fuel"].map((use) => (
              <span
                key={use}
                className="px-4 py-2 bg-amber-50 border border-amber-200 text-[#5C3A21] font-semibold text-sm rounded-full"
              >
                {use}
              </span>
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
