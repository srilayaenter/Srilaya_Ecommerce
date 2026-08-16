"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grains, ShoppingCart, Lightning, Leaf, Drop, Heartbeat, Clock, WhatsappLogo } from "@phosphor-icons/react";

const PHONE = "918660321315";

const MILLET_FLAKES = [
  {
    id: "foxtail",
    name: "Foxtail Flakes",
    keyword: "foxtail flakes",
    local: "Navane Avalakki / Thinai Aval",
    badge: "Top Seller",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    tags: ["millet", "diabetic"],
    benefits: [
      { label: "Low Glycemic Index", desc: "Steady blood sugar, no spikes" },
      { label: "Heart Healthy", desc: "Natural plant sterols lower cholesterol" },
      { label: "High Fiber", desc: "Keeps you full, aids weight management" },
    ],
  },
  {
    id: "ragi",
    name: "Ragi Flakes",
    keyword: "ragi flakes",
    local: "Kezhvaragu Aval / Finger Millet Flakes",
    badge: "Calcium Rich",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    accent: "#5C3A21",
    tags: ["millet", "family", "bone"],
    benefits: [
      { label: "Highest Plant Calcium", desc: "Stronger bones & teeth for all ages" },
      { label: "Iron Rich", desc: "Fights anaemia naturally" },
      { label: "Kids & Elderly Friendly", desc: "Gentle, nutrient-dense & easy to digest" },
    ],
  },
  {
    id: "pearl",
    name: "Pearl Flakes",
    keyword: "pearl flakes",
    local: "Kambu Aval / Bajra Flakes / Sajje",
    badge: "Energy Boost",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#b45309",
    tags: ["millet", "heart"],
    benefits: [
      { label: "Iron & Mineral Dense", desc: "Boosts vitality and daily energy" },
      { label: "Heart Protective", desc: "Rich in potassium, supports blood pressure" },
      { label: "Metabolic Booster", desc: "Ignites daily metabolism" },
    ],
  },
  {
    id: "barnyard",
    name: "Barnyard Flakes",
    keyword: "barnyard flakes",
    local: "Kuthiraivali Aval / Sanwa",
    badge: "Quick Meal",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    tags: ["millet", "diabetic"],
    benefits: [
      { label: "Fastest to Cook", desc: "Ready in under 5 minutes" },
      { label: "Low GI", desc: "Ideal for diabetics & weight watchers" },
      { label: "High Satiety", desc: "Stays filling for hours" },
    ],
  },
  {
    id: "little",
    name: "Little Flakes",
    keyword: "little flakes",
    local: "Samai Aval / Same Avalakki / Kutki",
    badge: "Digestive Care",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    tags: ["millet", "digestive"],
    benefits: [
      { label: "Gentle on Digestion", desc: "Easy stomach absorption" },
      { label: "Antioxidant Rich", desc: "Fights free radical damage" },
      { label: "Respiratory Health", desc: "Soothing & anti-inflammatory properties" },
    ],
  },
  {
    id: "kodo",
    name: "Kodo Flakes",
    keyword: "kodo flakes",
    local: "Varagu Aval / Kodra Flakes",
    badge: "Diabetic Friendly",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    accent: "#6d28d9",
    tags: ["millet", "diabetic"],
    benefits: [
      { label: "Proven Blood Sugar Control", desc: "Clinically reduces glucose levels" },
      { label: "Fiber Rich", desc: "Detox support & longer fullness" },
      { label: "Cell Protection", desc: "Antioxidants guard against damage" },
    ],
  },
  {
    id: "white-sorghum",
    name: "White Sorghum Flakes",
    keyword: "white sorghum flakes",
    local: "Jowar Aval / Cholam Avalakki",
    badge: "Gut Health",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#d97706",
    tags: ["millet", "heart", "digestive"],
    benefits: [
      { label: "Prebiotic Fibre", desc: "Feeds healthy gut bacteria" },
      { label: "Heart Healthy", desc: "Natural plant sterols" },
      { label: "Sustained Energy", desc: "Complex carbs for long-lasting stamina" },
    ],
  },
  {
    id: "red-sorghum",
    name: "Red Sorghum Flakes",
    keyword: "red sorghum flakes",
    local: "Cholam Aval / Red Jowar Flakes",
    badge: "Antioxidant",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "#9f1239",
    tags: ["millet", "heart"],
    benefits: [
      { label: "Rich in Polyphenols", desc: "Reduces oxidative stress" },
      { label: "Gut Support", desc: "Prebiotic dietary fibre" },
      { label: "Sustained Stamina", desc: "Complex carbs for energy" },
    ],
  },
  {
    id: "mapillai",
    name: "Mapillai Samba Flakes",
    keyword: "mapillai samba flakes",
    local: "Traditional Heritage Red Rice Flakes",
    badge: "Heritage Grain",
    badgeColor: "bg-red-100 text-red-800 border-red-300",
    accent: "#b91c1c",
    tags: ["millet", "family"],
    benefits: [
      { label: "B-Complex Vitamins", desc: "High micronutrient density" },
      { label: "Immunity Boost", desc: "Natural antioxidants & defence" },
      { label: "Heritage Vitality", desc: "Traditionally consumed for strength" },
    ],
  },
];

const HERITAGE_RICE_FLAKES = [
  {
    id: "poongar",
    name: "Poongar Flakes",
    keyword: "poongar flakes",
    local: "Poongar Rice Aval",
    badge: "Women's Health",
    badgeColor: "bg-pink-50 text-pink-800 border-pink-200",
    accent: "#be185d",
    tags: ["heritage", "family"],
    benefits: [
      { label: "Hormonal Balance", desc: "Natural phytoestrogens support women's health" },
      { label: "Iron Rich", desc: "Prevents anaemia, boosts hemoglobin" },
      { label: "Postnatal Nutrition", desc: "Traditionally given to new mothers" },
    ],
  },
  {
    id: "kattuyanam",
    name: "Kattuyanam Flakes",
    keyword: "kattuyanam flakes",
    local: "Kattuyanam Rice Aval",
    badge: "Diabetic Care",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    accent: "#0f766e",
    tags: ["heritage", "diabetic"],
    benefits: [
      { label: "Low Glycemic Response", desc: "Slow glucose release, ideal for diabetics" },
      { label: "High Fibre Content", desc: "Supports digestive health" },
      { label: "Rich in Minerals", desc: "Iron, zinc & manganese dense" },
    ],
  },
  {
    id: "karunguruvai",
    name: "Karunguruvai Flakes",
    keyword: "karunguruvai flakes",
    local: "Karunguruvai Rice Aval",
    badge: "Antioxidant",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    accent: "#4338ca",
    tags: ["heritage"],
    benefits: [
      { label: "High Antioxidants", desc: "Dark pigment packs powerful phytonutrients" },
      { label: "Digestive Wellness", desc: "Natural fibre supports gut health" },
      { label: "Traditional Nourishment", desc: "Ancient grain, modern nutrition" },
    ],
  },
  {
    id: "thanga-samba",
    name: "Thanga Samba Flakes",
    keyword: "thanga samba flakes",
    local: "Thanga Samba Rice Aval — Golden Heritage Rice",
    badge: "Heritage",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
    accent: "#92400e",
    tags: ["heritage", "family"],
    benefits: [
      { label: "Nutrient Dense", desc: "Vitamins & minerals fully retained" },
      { label: "Gentle Digestion", desc: "Easy on the stomach for all ages" },
      { label: "Aromatic Flavour", desc: "Distinct taste from traditional cultivation" },
    ],
  },
  {
    id: "karupukavuni",
    name: "Karupukavuni Flakes",
    keyword: "karupukavuni flakes",
    local: "Black Rice Aval / Forbidden Rice Flakes",
    badge: "Superfood",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    accent: "#581c87",
    tags: ["heritage", "heart"],
    benefits: [
      { label: "Anthocyanin Rich", desc: "Highest antioxidant of any rice variety" },
      { label: "Heart & Brain Health", desc: "Anti-inflammatory pigment compounds" },
      { label: "Blood Sugar Friendly", desc: "Lower GI than white rice" },
    ],
  },
  {
    id: "red-matta",
    name: "Red Matta Rice Flakes",
    keyword: "red matta rice flakes",
    local: "Rosematta Aval / Kerala Red Rice Flakes",
    badge: "High Fibre",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    accent: "#b91c1c",
    tags: ["heritage", "digestive"],
    benefits: [
      { label: "Bran Intact", desc: "High fibre, zero polishing" },
      { label: "Gut Friendly", desc: "Prebiotic fibre feeds good bacteria" },
      { label: "Sustained Energy", desc: "Complex carbs for long-lasting fuel" },
    ],
  },
  {
    id: "red-rice",
    name: "Red Rice Flakes",
    keyword: "red rice flakes",
    local: "Sivappu Arisi Aval / Lal Chawal Poha",
    badge: "Iron Rich",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "#e11d48",
    tags: ["heritage", "family"],
    benefits: [
      { label: "Iron & Zinc Dense", desc: "Fights anaemia & boosts immunity" },
      { label: "Full Bran Retained", desc: "All nutrients intact, nothing stripped" },
      { label: "Low GI", desc: "Gentler on blood sugar than white rice" },
    ],
  },
];

const GRAIN_FLAKES = [
  {
    id: "wheat",
    name: "Wheat Flakes",
    keyword: "wheat flakes",
    local: "Gehun Poha / Godhi Aval",
    badge: "Whole Grain",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#ca8a04",
    tags: ["grain", "family"],
    benefits: [
      { label: "Whole Grain Goodness", desc: "100% bran retained" },
      { label: "High Dietary Fibre", desc: "Supports gut health" },
      { label: "Versatile Kitchen Use", desc: "Upma, porridge, bakes" },
    ],
  },
  {
    id: "barley",
    name: "Barley Flakes",
    keyword: "barley flakes",
    local: "Jau Poha / Yava Aval",
    badge: "Beta-Glucan",
    badgeColor: "bg-green-50 text-green-800 border-green-200",
    accent: "#15803d",
    tags: ["grain", "heart", "diabetic"],
    benefits: [
      { label: "Beta-Glucan Fibre", desc: "Clinically reduces cholesterol" },
      { label: "Blood Sugar Control", desc: "Slow glucose release" },
      { label: "Gut Microbiome", desc: "Prebiotic that feeds good bacteria" },
    ],
  },
  {
    id: "green-gram",
    name: "Green Gram Flakes",
    keyword: "green gram flakes",
    local: "Moong Aval / Pachai Payiru Aval",
    badge: "High Protein",
    badgeColor: "bg-lime-50 text-lime-800 border-lime-200",
    accent: "#65a30d",
    tags: ["grain", "family"],
    benefits: [
      { label: "Highest Protein", desc: "Muscle building & repair" },
      { label: "Antioxidant Rich", desc: "Phenolic acids fight inflammation" },
      { label: "Easy to Digest", desc: "Gentle even for sensitive stomachs" },
    ],
  },
  {
    id: "moth-beans",
    name: "Moth Beans Flakes",
    keyword: "moth beans flakes",
    local: "Matki Poha / Moth Payiru Aval",
    badge: "Protein Rich",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#c2410c",
    tags: ["grain"],
    benefits: [
      { label: "High Protein & Iron", desc: "Supports muscle health" },
      { label: "Drought-Resilient Grain", desc: "Sustainable traditional legume" },
      { label: "Versatile", desc: "Upma, chilla, porridge" },
    ],
  },
  {
    id: "horsegram",
    name: "Horsegram Flakes",
    keyword: "horsegram flakes",
    local: "Kulith Aval / Kollu Aval",
    badge: "Weight Care",
    badgeColor: "bg-stone-50 text-stone-800 border-stone-200",
    accent: "#57534e",
    tags: ["grain", "diabetic"],
    benefits: [
      { label: "Weight Management", desc: "High satiety, low calorie" },
      { label: "Kidney Stone Prevention", desc: "Diuretic properties" },
      { label: "Blood Sugar Friendly", desc: "Low GI legume" },
    ],
  },
];

const ALL_PRODUCTS = [...MILLET_FLAKES, ...HERITAGE_RICE_FLAKES, ...GRAIN_FLAKES];

const FILTER_OPTIONS = [
  { key: "all", label: "All Varieties" },
  { key: "millet", label: "Millet Flakes" },
  { key: "heritage", label: "Heritage Rice" },
  { key: "grain", label: "Grain & Legume" },
  { key: "diabetic", label: "Diabetic Care" },
  { key: "heart", label: "Heart Health" },
  { key: "family", label: "Kids & Family" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

export default function FlakesPageClient({ productImageMap = {} }: { productImageMap?: ImageMap }) {
  const [activeFilter, setActiveFilter] = useState("all");

  function getProductImage(keyword: string): string | null {
    const entry = Object.entries(productImageMap).find(([title]) =>
      title.includes(keyword.toLowerCase())
    );
    return entry ? entry[1] : null;
  }

  const visibleMillet = activeFilter === "all" || activeFilter === "millet"
    ? MILLET_FLAKES.filter(p => activeFilter === "all" || activeFilter === "millet" ? true : p.tags.includes(activeFilter))
    : MILLET_FLAKES.filter(p => p.tags.includes(activeFilter));

  const visibleHeritage = activeFilter === "all" || activeFilter === "heritage"
    ? HERITAGE_RICE_FLAKES.filter(p => activeFilter === "all" || activeFilter === "heritage" ? true : p.tags.includes(activeFilter))
    : HERITAGE_RICE_FLAKES.filter(p => p.tags.includes(activeFilter));

  const visibleGrain = activeFilter === "all" || activeFilter === "grain"
    ? GRAIN_FLAKES.filter(p => activeFilter === "all" || activeFilter === "grain" ? true : p.tags.includes(activeFilter))
    : GRAIN_FLAKES.filter(p => p.tags.includes(activeFilter));

  const totalVisible = visibleMillet.length + visibleHeritage.length + visibleGrain.length;

  function openWhatsApp(product?: WhatsAppProduct) {
    const msg = product
      ? `Hello SriLaYa Naturals,\n\nI'm interested in ${product.name}. Could you share pricing and availability? Thank you!`
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Millet Flakes collection. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function ProductCard({ p }: { p: typeof ALL_PRODUCTS[0] }) {
    const imgUrl = getProductImage(p.keyword);
    return (
      <div
        className="bg-white/90 backdrop-blur-sm border border-[#D99B26]/15 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
        style={{ borderTop: `4px solid ${p.accent}` }}
      >
        {imgUrl ? (
          <div className="relative h-36 w-full bg-[#F5F5F5]">
            <Image src={imgUrl} alt={p.name} fill className="object-cover" unoptimized />
            <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
              {p.badge}
            </span>
          </div>
        ) : (
          <div className="h-36 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center relative">
            <Grains className="w-10 h-10" weight="regular" style={{ color: p.accent }} />
            <span className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
              {p.badge}
            </span>
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-[#5C3A21] text-base mb-0.5">{p.name}</h3>
          <p className="text-xs text-[#2E6F40] font-semibold uppercase tracking-wide mb-3">{p.local}</p>
          <ul className="space-y-1.5 text-xs text-gray-700 mb-4 flex-1">
            {p.benefits.map((b) => (
              <li key={b.label} className="flex items-start gap-1.5">
                <span className="text-[#2E6F40] mt-0.5">✔</span>
                <span><strong>{b.label}</strong> — {b.desc}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => openWhatsApp(p)}
            className="w-full py-2 bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white text-[#1a9e4a] font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-[#25D366]/40"
          >
            <WhatsappLogo size={13} weight="fill" />Enquire on WhatsApp
          </button>
        </div>
      </div>
    );
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
            <Grains className="w-4 h-4" weight="regular" /> Stone-Processed Flakes
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            Instant Nutrition,<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              Endless Variety
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s complete <strong className="text-[#5C3A21]">Flakes collection</strong> — 21 varieties
            across millets, heritage rices, and whole grains. Ready in minutes, packed with nutrition.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="#collection"
              className="bg-[#5C3A21] hover:bg-[#2E6F40] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" weight="regular" /> Explore Collection
            </a>
            <button
              onClick={() => openWhatsApp()}
              className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-8 py-3.5 rounded-xl text-base shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <WhatsappLogo size={15} weight="fill" />Chat on WhatsApp
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              ["21 Varieties", "One Collection"],
              ["Ready in 5 min", "No Soaking Needed"],
              ["Low GI Options", "Diabetic Friendly"],
              ["No Additives", "100% Pure Grain"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 bg-white/80 rounded-lg border border-amber-200/60 text-center shadow-sm">
                <div className="text-[#2E6F40] font-bold text-sm">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Filter + collection */}
        <section id="collection" className="scroll-mt-24">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#5C3A21]">
              Our Complete Flakes Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              From everyday millet flakes to rare heritage varieties — 21 choices for every health goal and kitchen need.
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

          {totalVisible === 0 && (
            <p className="text-center text-gray-400 py-12">No varieties match this filter.</p>
          )}

          {/* Millet Flakes group */}
          {visibleMillet.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px flex-1 bg-amber-200" />
                <h3 className="text-xs font-bold text-[#5C3A21] uppercase tracking-widest whitespace-nowrap">
                  Millet Flakes ({visibleMillet.length})
                </h3>
                <span className="h-px flex-1 bg-amber-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleMillet.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {/* Heritage Rice Flakes group */}
          {visibleHeritage.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px flex-1 bg-red-100" />
                <h3 className="text-xs font-bold text-[#b91c1c] uppercase tracking-widest whitespace-nowrap">
                  Heritage Rice Flakes ({visibleHeritage.length})
                </h3>
                <span className="h-px flex-1 bg-red-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleHeritage.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {/* Grain & Legume Flakes group */}
          {visibleGrain.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px flex-1 bg-green-100" />
                <h3 className="text-xs font-bold text-[#15803d] uppercase tracking-widest whitespace-nowrap">
                  Grain & Legume Flakes ({visibleGrain.length})
                </h3>
                <span className="h-px flex-1 bg-green-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleGrain.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </section>

        {/* Why Flakes section */}
        <section className="bg-gradient-to-r from-[#2E6F40] to-emerald-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Wellness First
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              Why Choose Flakes?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              Why switching from refined cereals to SriLaYa Flakes is the best breakfast decision you can make.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: Clock, title: "Ready in 5 Min", desc: "No soaking, no long cooking — faster than any packet cereal." },
              { icon: Lightning, title: "Instant Energy", desc: "Complex carbs deliver clean, sustained energy without crashes." },
              { icon: Drop, title: "Zero Refining", desc: "Stone-processed with full bran intact — nutrition never stripped." },
              { icon: Heartbeat, title: "Heart & Gut Friendly", desc: "Fibre-rich, low GI varieties support blood sugar and heart health." },
              { icon: Leaf, title: "No Additives", desc: "100% pure grain — no sugar coating, no preservatives, no maida." },
            ].map((b) => (
              <div
                key={b.title}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 text-center hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#D99B26] text-[#5C3A21] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow">
                  <b.icon className="w-7 h-7" weight="regular" />
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
