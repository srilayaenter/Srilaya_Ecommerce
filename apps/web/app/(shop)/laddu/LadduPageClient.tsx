"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Cookie, ShoppingCart, Leaf, Drop, Heartbeat, Grains, WhatsappLogo } from "@phosphor-icons/react";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "foxtail",
    name: "Foxtail Millet Laddu",
    keyword: "foxtail millet laddu",
    local: "Navane Unde / Thinai Laddu",
    badge: "Best Seller",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    tags: ["millet", "diabetic"],
    desc: "Classic millet laddu roasted in ghee, sweetened with unrefined cane sugar and laced with cardamom. Foxtail millet adds a nutty depth and keeps blood sugar steady.",
    benefits: [
      { label: "Low Glycemic Index", desc: "Sweet without the blood sugar spike" },
      { label: "Heart Healthy", desc: "Natural plant sterols from foxtail millet" },
      { label: "High Fibre", desc: "Keeps you satisfied longer" },
    ],
  },
  {
    id: "barnyard",
    name: "Barnyard Millet Laddu",
    keyword: "barnyard millet laddu",
    local: "Kuthiraivali Unde / Sanwa Laddu",
    badge: "Diabetic Friendly",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    tags: ["millet", "diabetic", "weight"],
    desc: "Light and wholesome laddus made from barnyard millet — one of the lowest GI millets — roasted to a golden finish with ghee and unrefined cane sugar.",
    benefits: [
      { label: "Lowest GI Millet", desc: "Ideal for diabetics & weight management" },
      { label: "High Satiety", desc: "Fills you up without the calorie load" },
      { label: "Easy Digestion", desc: "Light on the stomach, perfect for all ages" },
    ],
  },
  {
    id: "till-little",
    name: "Till & Little Millet Laddu",
    keyword: "till & little millet laddu",
    local: "Ellu-Samai Unde / Til-Kutki Laddu",
    badge: "Calcium Boost",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    tags: ["millet", "family", "bone"],
    desc: "A unique pairing of sesame seeds (till) and little millet — both powerhouses of calcium and iron — bound together with unrefined cane sugar and ghee.",
    benefits: [
      { label: "Calcium from Sesame", desc: "Supports bone density & dental health" },
      { label: "Iron Rich", desc: "Fights anaemia, boosts hemoglobin" },
      { label: "Kids & Women Friendly", desc: "Traditional postnatal nourishment" },
    ],
  },
  {
    id: "groundnut",
    name: "Groundnut Laddu",
    keyword: "groundnut laddu",
    local: "Verkadalai Unde / Moongfali Laddu",
    badge: "Protein Rich",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#ca8a04",
    tags: ["protein", "family"],
    desc: "Roasted groundnuts crushed and bound with unrefined cane sugar — a timeless energy-dense sweet that delivers protein and healthy fats in every bite.",
    benefits: [
      { label: "High Protein", desc: "Muscle building & sustained energy" },
      { label: "Healthy Fats", desc: "Monounsaturated fats support heart health" },
      { label: "Natural Energy Bar", desc: "Great pre/post workout snack" },
    ],
  },
  {
    id: "till-sesame",
    name: "Till Sesame Laddu",
    keyword: "till sesame",
    local: "Ellu Unde / Til Laddu",
    badge: "Calcium Rich",
    badgeColor: "bg-stone-50 text-stone-800 border-stone-200",
    accent: "#78716c",
    tags: ["millet", "bone", "family"],
    desc: "Pure black sesame laddus — no millet blend — roasted and bound with unrefined cane sugar. A traditional postnatal sweet packed with calcium and iron.",
    benefits: [
      { label: "Highest Calcium", desc: "Black sesame is one of nature's richest calcium sources" },
      { label: "Iron Boost", desc: "Combats anaemia, supports haemoglobin levels" },
      { label: "Postnatal Favourite", desc: "Traditional nourishment for new mothers" },
    ],
  },
  {
    id: "horse-gram",
    name: "Horse Gram Laddu",
    keyword: "horse gram laddu",
    local: "Kollu Unde / Kulthi Laddu",
    badge: "High Protein",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#c2410c",
    tags: ["protein", "weight", "diabetic"],
    desc: "Horse gram (kollu) laddus — one of the highest plant-protein legumes — roasted and sweetened with unrefined cane sugar. Traditional, filling, and deeply nutritious.",
    benefits: [
      { label: "Highest Plant Protein", desc: "More protein per gram than most legumes" },
      { label: "Weight Management", desc: "High satiety, supports fat metabolism" },
      { label: "Diabetic Friendly", desc: "Low GI legume with slow glucose release" },
    ],
  },
  {
    id: "green-gram",
    name: "Green Gram Laddu",
    keyword: "green gram laddu",
    local: "Pachai Payiru Unde / Moong Laddu",
    badge: "Digestive Care",
    badgeColor: "bg-lime-50 text-lime-800 border-lime-200",
    accent: "#4d7c0f",
    tags: ["protein", "family", "diabetic"],
    desc: "Roasted green gram (moong) laddus sweetened with unrefined cane sugar — light, easy to digest, and rich in plant protein. A wholesome treat for all ages.",
    benefits: [
      { label: "Easily Digestible", desc: "Lightest legume on the stomach" },
      { label: "Rich in Protein", desc: "Complete amino acid profile from whole moong" },
      { label: "Kids & Elderly Friendly", desc: "Gentle nutrition for sensitive digestions" },
    ],
  },
  {
    id: "moth-bean",
    name: "Moth Bean Laddu",
    keyword: "moth bean laddu",
    local: "Naripayiru Unde / Matki Laddu",
    badge: "Iron Rich",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "#9f1239",
    tags: ["protein", "bone"],
    desc: "Moth bean (naripayiru) laddus roasted and bound with unrefined cane sugar — a lesser-known superfood legume loaded with iron, protein, and fibre.",
    benefits: [
      { label: "Rich in Iron", desc: "Fights anaemia and boosts energy levels" },
      { label: "High Fibre", desc: "Supports gut health and satiety" },
      { label: "Protein Dense", desc: "Excellent plant-based protein source" },
    ],
  },
];

const FILTER_OPTIONS = [
  { key: "all", label: "All Laddus" },
  { key: "millet", label: "Millet Based" },
  { key: "diabetic", label: "Diabetic Friendly" },
  { key: "family", label: "Kids & Family" },
  { key: "protein", label: "Protein Rich" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

export default function LadduPageClient({ productImageMap = {} }: { productImageMap?: ImageMap }) {
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
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Millet Laddu collection. Could you help me?";
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
            <Cookie className="w-4 h-4" weight="regular" /> Handcrafted Traditional Sweets
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            Guilt-Free Sweets,<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              Made the Old Way
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s handcrafted <strong className="text-[#5C3A21]">Millet Laddus</strong> — roasted in
            ghee, sweetened with unrefined cane sugar, zero refined sugar. The sweet your grandmother would approve of.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="#collection"
              className="bg-[#5C3A21] hover:bg-[#2E6F40] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" weight="regular" /> Shop Laddus
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
              ["No Refined Sugar", "Unrefined Cane Sugar"],
              ["Roasted in Ghee", "Traditional Method"],
              ["No Preservatives", "Made Fresh in Batches"],
              ["Millet Based", "Low GI Sweets"],
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
              Our Laddu Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              Every laddu is handcrafted in small batches — roasted grain, real ghee, unrefined cane sugar. Nothing else.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visibleProducts.map((p) => {
              const imgUrl = getProductImage(p.keyword);
              return (
                <div
                  key={p.id}
                  className="bg-white/90 backdrop-blur-sm border border-[#5C3A21]/10 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                  style={{ borderTop: `4px solid ${p.accent}` }}
                >
                  {imgUrl ? (
                    <div className="relative h-52 w-full bg-[#F5F5F5]">
                      <Image src={imgUrl} alt={p.name} fill className="object-cover" unoptimized />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  ) : (
                    <div className="h-52 bg-gradient-to-br from-[#FDF0E8] to-amber-100 flex items-center justify-center relative">
                      <Cookie className="w-16 h-16" weight="regular" style={{ color: p.accent }} />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-serif text-2xl font-bold text-[#5C3A21] mb-1">{p.name}</h3>
                    <p className="text-xs font-semibold text-[#2E6F40] uppercase tracking-wider mb-3">{p.local}</p>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{p.desc}</p>
                    <ul className="space-y-2 text-sm text-gray-700 mb-6 flex-1">
                      {p.benefits.map((b) => (
                        <li key={b.label} className="flex items-start gap-2">
                          <span className="text-[#2E6F40] mt-0.5 text-xs">✔</span>
                          <span><strong>{b.label}</strong> — {b.desc}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => openWhatsApp(p)}
                      className="w-full py-2.5 bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white text-[#1a9e4a] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-[#25D366]/40"
                    >
                      <WhatsappLogo size={15} weight="fill" />Enquire on WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why our Laddus */}
        <section className="bg-gradient-to-r from-[#5C3A21] to-[#2E6F40] text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Made with Integrity
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              What Makes Our Laddus Different?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              Why SriLaYa Millet Laddus are the only sweet you can enjoy without guilt.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Drop, title: "Unrefined Cane Sugar", desc: "Less processed sweetener — retains natural minerals, no bleaching or chemicals." },
              { icon: Grains, title: "Whole Millet Grain", desc: "Stone-roasted whole millet retains full fibre, minerals & vitamins." },
              { icon: Leaf, title: "Pure Ghee", desc: "Traditional clarified butter for flavour, fat-soluble vitamins & aroma." },
              { icon: Heartbeat, title: "No Preservatives", desc: "Made in small batches — no chemicals, no additives, no fillers." },
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

        {/* Bulk & gifting CTA */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <h3 className="font-serif text-2xl font-bold text-[#5C3A21] mb-2">Bulk Orders & Festival Gifting</h3>
          <p className="text-gray-600 text-sm max-w-lg mx-auto mb-5">
            Planning a festive box, corporate gift, or bulk order? We prepare laddus fresh in custom quantities for
            Diwali, Pongal, weddings, and corporate gifting.
          </p>
          <button
            onClick={() => openWhatsApp()}
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-8 py-3 rounded-xl text-sm shadow-md transition-all"
          >
            <WhatsappLogo size={16} weight="fill" />Chat for Bulk Enquiry
          </button>
        </section>

        {/* Recipes link */}
        <section className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Want to make laddus at home?{" "}
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
