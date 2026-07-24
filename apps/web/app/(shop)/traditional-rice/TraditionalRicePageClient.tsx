"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "mapillai-samba",
    name: "Mapillai Samba Rice",
    keyword: "mapillai samba",
    emoji: "👑",
    local: "Bridegroom's Rice / Maravar Samba",
    badge: "Strength Rice",
    badgeColor: "bg-red-100 text-red-900 border-red-300",
    accent: "#9f1239",
    accentLight: "#FFF1F2",
    tags: ["heart", "heritage"],
    benefits: [
      { label: "Traditional Strength Rice", desc: "Historically consumed for stamina, endurance, and vitality" },
      { label: "Rich in Vitamin B1", desc: "Supports nerve function and healthy energy metabolism" },
      { label: "Heart Health & Low GI", desc: "Natural plant compounds promote cardiac wellness" },
    ],
    story: "Named after the bridegroom — traditionally given to men as a strength food before marriage ceremonies.",
  },
  {
    id: "karupu-kavuni",
    name: "Karupu Kavuni Rice",
    keyword: "karupu kavuni",
    emoji: "🫐",
    local: "Black Rice / Forbidden Rice of Kings",
    badge: "Superfood",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    accent: "#4c1d95",
    accentLight: "#F5F3FF",
    tags: ["immunity", "heritage"],
    benefits: [
      { label: "Rich in Anthocyanins", desc: "The same antioxidant that makes blueberries a superfood" },
      { label: "Boosts Immunity", desc: "Aids respiratory health and strengthens immune defences" },
      { label: "Anti-Inflammatory", desc: "Powerful polyphenols reduce chronic inflammation" },
    ],
    story: "Once reserved exclusively for royalty in ancient China — called the 'Forbidden Rice' for good reason.",
  },
  {
    id: "poongar",
    name: "Poongar Rice",
    keyword: "poongar",
    emoji: "🌸",
    local: "Women's Rice / Poongar Arisi",
    badge: "Women's Health",
    badgeColor: "bg-pink-100 text-pink-900 border-pink-300",
    accent: "#9d174d",
    accentLight: "#FDF2F8",
    tags: ["women", "heritage"],
    benefits: [
      { label: "Prenatal & Postnatal Support", desc: "Traditionally consumed by women during pregnancy and nursing" },
      { label: "Hormonal Balance", desc: "Natural phytoestrogens help regulate hormonal health" },
      { label: "Easy Digestion", desc: "Gentle on the stomach, ideal for postpartum recovery" },
    ],
    story: "Known as Women's Rice in Tamil culture — gifted to new mothers for nourishment and recovery.",
  },
  {
    id: "seeraga-samba",
    name: "Seeraga Samba Rice",
    keyword: "seeraga samba",
    emoji: "✨",
    local: "Jeera Samba / Aromatic Heritage Rice",
    badge: "Aromatic",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#d97706",
    accentLight: "#FFFBEB",
    tags: ["heart", "immunity"],
    wide: true,
    benefits: [
      { label: "Highly Aromatic & Delicate", desc: "A natural cumin-like fragrance that elevates every dish" },
      { label: "Easy Digestion & Nutrient Absorption", desc: "Small grain size makes it lighter on the stomach" },
      { label: "Rich in Antioxidants", desc: "Natural plant compounds protect against oxidative stress" },
    ],
    story: "The rice of South Indian feasts — used in Biryani, Pongal, and temple offerings for its unmatched aroma.",
  },
];

const FILTER_OPTIONS = [
  { key: "all", label: "All Varieties" },
  { key: "heritage", label: "Heritage Grains" },
  { key: "heart", label: "Heart Health" },
  { key: "women", label: "Women's Health" },
  { key: "immunity", label: "Immunity" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

type TraditionalRicePageClientProps = {
  productImageMap?: ImageMap;
};

export default function TraditionalRicePageClient({ productImageMap = {} }: TraditionalRicePageClientProps) {
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
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Traditional Rice collection. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-950/10 via-amber-50/30 to-[#FDFBF7] py-16 md:py-24 border-b border-red-900/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(#9f1239 0.75px, transparent 0.75px), radial-gradient(#9f1239 0.75px, #fdfbf7 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-900/10 text-red-900 font-bold text-xs uppercase tracking-wider mb-6 border border-red-900/20">
            🍚 Heritage & Traditional Rice
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-red-950 leading-tight max-w-4xl mx-auto mb-4">
            Nature&apos;s Ancient Gems:<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              The Rice Revolution.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s signature{" "}
            <strong className="text-red-900">Traditional Rice collection</strong> — 4 heritage varieties
            with deep cultural roots and proven health benefits. A timeless blend of flavour and wellness.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="#collection"
              className="bg-red-900 hover:bg-[#2E6F40] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
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
              ["4 Heritage Varieties", "Rare & Authentic"],
              ["Low GI", "Diabetic Friendly"],
              ["Antioxidant Rich", "Superfood Grains"],
              ["Traditionally Farmed", "Sustainable Farming"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 bg-white/80 rounded-lg border border-red-900/10 text-center shadow-sm">
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
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-red-950">
              Our Heritage Rice Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              Each variety carries centuries of tradition — cultivated sustainably, naturally preserved, and deeply nourishing.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeFilter === f.key
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white text-gray-600 border-red-900/20 hover:bg-red-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visibleProducts.map((p) => {
              const imgUrl = getProductImage(p.keyword);
              return (
                <div
                  key={p.id}
                  className={`bg-white/90 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                    p.wide ? "md:col-span-2" : ""
                  }`}
                  style={{ borderTop: `4px solid ${p.accent}`, borderColor: `${p.accent}20` }}
                >
                  {imgUrl ? (
                    <div className="relative h-52 w-full bg-[#F5F5F5]">
                      <Image src={imgUrl} alt={p.name} fill className="object-cover" unoptimized />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="h-52 flex items-center justify-center relative"
                      style={{ backgroundColor: p.accentLight }}
                    >
                      <span className="text-7xl">{p.emoji}</span>
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className={`p-6 flex flex-col flex-1 ${p.wide ? "md:flex-row md:gap-8" : ""}`}>
                    <div className="flex-1">
                      <h3 className="font-serif text-2xl font-bold mb-1" style={{ color: p.accent }}>
                        {p.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#2E6F40] uppercase tracking-wider mb-4">{p.local}</p>

                      <ul className="space-y-2 text-sm text-gray-700 mb-4">
                        {p.benefits.map((b) => (
                          <li key={b.label} className="flex items-start gap-2">
                            <span className="mt-0.5 text-xs" style={{ color: p.accent }}>✔</span>
                            <span><strong>{b.label}</strong> — {b.desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div
                        className="text-xs px-3 py-2 rounded-lg mb-4 italic text-gray-600"
                        style={{ backgroundColor: p.accentLight }}
                      >
                        📖 {p.story}
                      </div>

                      <button
                        onClick={() => openWhatsApp(p)}
                        className="w-full py-2.5 bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white text-[#1a9e4a] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-[#25D366]/40"
                      >
                        💬 Enquire on WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Traditional Rice */}
        <section className="bg-gradient-to-r from-red-950 to-[#2E6F40] text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Wellness First
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              Why Heritage Rice?
            </h2>
            <p className="text-red-100 mt-2 text-sm">
              Modern white rice is stripped of nutrition. Heritage varieties retain what nature put there for a reason.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🫐", title: "Anthocyanin Rich", desc: "Karupu Kavuni's deep pigment contains some of the highest antioxidant levels of any grain." },
              { icon: "📉", title: "Low Glycemic Response", desc: "Heritage rices release glucose slowly — far gentler on blood sugar than polished white rice." },
              { icon: "🌿", title: "Gut Microbiome Wellness", desc: "Higher fibre content and natural resistant starch feed beneficial gut bacteria." },
              { icon: "⚖️", title: "Hormonal Balance", desc: "Poongar rice's natural phytoestrogens support women's hormonal health at every life stage." },
              { icon: "💪", title: "Essential Nutrient Density", desc: "Vitamins, minerals, and micronutrients lost in polishing are fully retained here." },
              { icon: "🏺", title: "Cultural Culinary Diversity", desc: "From Biryani to Pongal, Payasam to Idli — each variety has its traditional dish it excels in." },
            ].map((b) => (
              <div
                key={b.title}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-[#D99B26] rounded-xl flex items-center justify-center text-xl mb-4 shadow">
                  {b.icon}
                </div>
                <h3 className="font-bold text-base mb-1">{b.title}</h3>
                <p className="text-xs text-red-100">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cooking tip */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8 text-center">
          <h2 className="font-serif text-xl font-bold text-[#5C3A21] mb-2">Cooking Tip</h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Traditional rice varieties benefit from <strong>soaking for 30–60 minutes</strong> before cooking. This reduces cooking time,
            improves texture, and makes nutrients more bioavailable. Cook with a slightly higher water ratio (1:2.5) than regular white rice.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {["Idli & Dosa", "Pongal", "Biryani & Pulao", "Payasam", "Steamed Rice", "Khichdi"].map((use) => (
              <span
                key={use}
                className="px-4 py-2 bg-white border border-amber-200 text-[#5C3A21] font-semibold text-sm rounded-full"
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
