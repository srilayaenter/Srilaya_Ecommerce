"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grains, ShoppingCart, Gear, Heartbeat, Bone, ForkKnife , WhatsappLogo } from "@phosphor-icons/react";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "foxtail",
    name: "Foxtail Flour",
    keyword: "foxtail flour",
    local: "Navane Hittu / Thinai Maavu / Kangni Atta",
    badge: "Heart Healthy",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    tags: ["diabetic", "heart"],
    benefits: [
      { label: "Heart Healthy", desc: "Natural plant sterols lower bad cholesterol" },
      { label: "Nerve Function Support", desc: "Rich in B-vitamins for nerve health" },
      { label: "Sustained Energy", desc: "Low GI — no blood sugar spikes" },
    ],
  },
  {
    id: "finger",
    name: "Finger Flour (Ragi)",
    keyword: "finger flour",
    local: "Ragi Hittu / Kezhvaragu Maavu",
    badge: "Calcium Rich",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    accent: "#5C3A21",
    tags: ["family", "bone"],
    benefits: [
      { label: "Highest Calcium Content", desc: "Stronger bones & teeth for all ages" },
      { label: "Boosts Hemoglobin", desc: "High iron — ideal for anaemia prevention" },
      { label: "Promotes Relaxation", desc: "Natural tryptophan calms nerves & aids sleep" },
    ],
  },
  {
    id: "red-sorghum",
    name: "Red Sorghum Flour",
    keyword: "red sorghum flour",
    local: "Jowar Maavu / Cholam Hittu",
    badge: "Gut Health",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "#9f1239",
    tags: ["heart", "digestive"],
    benefits: [
      { label: "Gut Health Support", desc: "Prebiotic fibre feeds healthy gut bacteria" },
      { label: "Reduces Oxidative Stress", desc: "Rich in antioxidant polyphenols" },
      { label: "Sustainable Energy", desc: "Complex carbs for long-lasting stamina" },
    ],
  },
  {
    id: "barnyard",
    name: "Barnyard Flour",
    keyword: "barnyard flour",
    local: "Kuthiraivali Maavu / Sanwa Atta",
    badge: "Low GI",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    tags: ["diabetic", "digestive"],
    benefits: [
      { label: "Low Glycemic Index", desc: "Ideal for diabetics & weight management" },
      { label: "Prebiotic Properties", desc: "Supports a healthy gut microbiome" },
      { label: "Easy Digestion", desc: "Light on stomach, perfect for all ages" },
    ],
  },
  {
    id: "pearl",
    name: "Pearl Flour (Bajra)",
    keyword: "pearl flour",
    local: "Kambu Maavu / Bajra Atta / Sajje Hittu",
    badge: "High Protein",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#b45309",
    tags: ["heart", "family"],
    benefits: [
      { label: "High Protein Content", desc: "Muscle building & repair support" },
      { label: "Brain Health Support", desc: "Rich in Phosphorus & essential fats" },
      { label: "Healthy Pregnancy", desc: "Folate-rich — essential for expecting mothers" },
    ],
  },
  {
    id: "sprouted-ragi",
    name: "Sprouted Ragi Flour",
    keyword: "sprouted ragi",
    local: "Molakattu Kezhvaragu Maavu",
    badge: "Enhanced Nutrition",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    tags: ["family", "bone", "diabetic"],
    benefits: [
      { label: "Enhanced Calcium Absorption", desc: "Sprouting increases bioavailability by 2×" },
      { label: "Natural Probiotic Action", desc: "Fermented enzymes aid digestion" },
      { label: "Ideal for Babies & Kids", desc: "Gentle, nutrient-dense first food" },
    ],
  },
  {
    id: "kodo",
    name: "Kodo Flour",
    keyword: "kodo flour",
    local: "Varagu Maavu / Kodra Atta",
    badge: "Diabetic Friendly",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    accent: "#6d28d9",
    tags: ["diabetic", "digestive"],
    benefits: [
      { label: "Diabetes Control", desc: "Proven to reduce blood glucose levels" },
      { label: "Fiber Rich", desc: "Keeps you fuller for longer, aids detox" },
      { label: "Cell Protection", desc: "Antioxidants guard against cellular damage" },
    ],
  },
  {
    id: "wheat",
    name: "Wheat Flour",
    keyword: "wheat flour",
    local: "Gehun Atta / Godhi Hittu",
    badge: "Whole Grain",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#ca8a04",
    tags: ["family", "heart"],
    wide: true,
    benefits: [
      { label: "Whole Grain Goodness", desc: "100% bran retained — none of the nutrition stripped away" },
      { label: "High Dietary Fibre", desc: "Supports gut health and healthy weight" },
      { label: "Energy & Stamina", desc: "Complex carbs for sustained daily energy" },
    ],
  },
];

const FILTER_OPTIONS = [
  { key: "all", label: "All Varieties" },
  { key: "diabetic", label: "Diabetic Care" },
  { key: "bone", label: "Bone & Calcium" },
  { key: "heart", label: "Heart Health" },
  { key: "digestive", label: "Digestive Care" },
  { key: "family", label: "Kids & Family" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

type FlourPageClientProps = {
  productImageMap?: ImageMap;
};

export default function FlourPageClient({ productImageMap = {} }: FlourPageClientProps) {
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
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Millet Flour collection. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FDF0E8]/80 via-amber-50/40 to-[#FDFBF7] py-16 md:py-24 border-b border-[#5C3A21]/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(#5C3A21 0.75px, transparent 0.75px), radial-gradient(#5C3A21 0.75px, #fdfbf7 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5C3A21]/10 text-[#5C3A21] font-bold text-xs uppercase tracking-wider mb-6 border border-[#5C3A21]/20">
            <Grains className="w-4 h-4" weight="regular" /> Stone-Ground Millet Flours
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            Bake Better.<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              Eat Smarter.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s signature{" "}
            <strong className="text-[#5C3A21]">Millet Flour collection</strong> — 8 varieties,
            stone-ground with the full bran intact for maximum nutrition.
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
              <WhatsappLogo size={15} weight="fill" className="inline-block mr-1" />Chat on WhatsApp
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              ["Stone-Ground", "Full Bran Intact"],
              ["8 Varieties", "One Collection"],
              ["Gluten-Free Options", "Wheat-Free Choices"],
              ["No Additives", "100% Pure Grain"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 bg-white/80 rounded-lg border border-[#5C3A21]/15 text-center shadow-sm">
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
              Our Signature Flour Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              From rotis and dosas to puttu and kheer — discover 8 millet flours, each with a unique nutritional story.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeFilter === f.key
                      ? "bg-[#5C3A21] text-white border-[#5C3A21]"
                      : "bg-white text-gray-600 border-[#5C3A21]/20 hover:bg-[#FDF0E8]"
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
                  className={`bg-white/90 backdrop-blur-sm border border-[#5C3A21]/10 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
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
                    <div className="h-44 bg-gradient-to-br from-[#FDF0E8] to-amber-100 flex items-center justify-center relative">
                      <Grains className="w-14 h-14" weight="regular" style={{ color: p.accent }} />
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
                            <div key={b.label} className="bg-[#FDF0E8]/60 p-3 rounded-lg border border-[#5C3A21]/15">
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
                      <WhatsappLogo size={15} weight="fill" className="inline-block mr-1" />Enquire on WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Health Benefits */}
        <section className="bg-gradient-to-r from-[#5C3A21] to-[#2E6F40] text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Wellness First
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              Why Millet Flour?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              Why switching from refined maida to SriLaYa Millet Flours is the best decision for your kitchen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: Gear, title: "Stone-Ground", desc: "Traditional cold milling preserves all vitamins, minerals & fibre." },
              { icon: Grains, title: "Full Bran Intact", desc: "Zero refining — all the goodness of the whole grain in every cup." },
              { icon: Heartbeat, title: "Diabetic Friendly", desc: "Low GI flours that help regulate blood sugar without spikes." },
              { icon: Bone, title: "Bone & Calcium", desc: "Ragi flour leads with the highest plant-based calcium content." },
              { icon: ForkKnife, title: "Kitchen Versatile", desc: "Rotis, dosas, puttu, kheer, ladoos — endless healthy possibilities." },
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
              Browse millet flour recipes →
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
