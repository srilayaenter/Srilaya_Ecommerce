"use client";

import Image from "next/image";
import Link from "next/link";
import { Drop, ShoppingCart, Microscope, TrendDown, Leaf, WhatsappLogo, Factory } from "@phosphor-icons/react";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "sugarcane",
    name: "Sugarcane Jaggery",
    keyword: "sugarcane jaggery",
    local: "Karumbu Vellam / Ganna Gud",
    badge: "Rich in Iron",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    accentLight: "#FFF8E1",
    production: "Traditional hot-boil process — retains natural nutrients and colour",
    benefits: [
      { label: "Rich in Iron", desc: "Helps prevent anaemia and boosts haemoglobin" },
      { label: "Boosts Energy", desc: "Natural sugars for sustained energy without crashes" },
      { label: "Traditional Flavour", desc: "Deep, earthy sweetness loved in Indian cooking" },
    ],
  },
  {
    id: "palm",
    name: "Palm Jaggery",
    keyword: "palm jaggery",
    local: "Karuppatti / Thaati Bellam / Nongu Vellam",
    badge: "Immunity Booster",
    badgeColor: "bg-red-50 text-red-800 border-red-200",
    accent: "#7f1d1d",
    accentLight: "#FEF2F2",
    production: "Naturally processed from palmyra sap — no chemicals, ethically sourced from Tamil Nadu farms",
    benefits: [
      { label: "Supports Immunity", desc: "Loaded with natural antioxidants that strengthen defences" },
      { label: "Eases Coughs & Colds", desc: "A traditional remedy for respiratory relief" },
      { label: "High in Antioxidants", desc: "Fights free radicals and promotes cellular health" },
    ],
  },
  {
    id: "coconut",
    name: "Coconut Jaggery",
    keyword: "coconut jaggery",
    local: "Thengai Vellam / Nariyal Gud",
    badge: "Low GI",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    accentLight: "#ECFDF5",
    production: "Evaporated under low heat — minimal processing preserves flavour and minerals",
    benefits: [
      { label: "Low Glycemic Index", desc: "Slower glucose release — gentler on blood sugar" },
      { label: "Supports Digestion", desc: "Natural inulin fibre acts as a prebiotic" },
      { label: "Mineral Rich", desc: "Packed with potassium, magnesium, and zinc" },
    ],
  },
  {
    id: "cane-sugar",
    name: "Unrefined Cane Sugar",
    keyword: "unrefined cane sugar",
    local: "Nattu Sakkarai / Desi Cheeni",
    badge: "Less Processed",
    badgeColor: "bg-lime-50 text-lime-800 border-lime-200",
    accent: "#65a30d",
    accentLight: "#F7FEE7",
    production: "Cold-pressed from sugarcane juice, sun-dried without bleaching or chemical refining",
    benefits: [
      { label: "Retains Molasses", desc: "Natural minerals intact — unlike white sugar" },
      { label: "Milder GI", desc: "Gentler blood sugar response than refined sugar" },
      { label: "Versatile Sweetener", desc: "Direct 1:1 swap for white sugar in all recipes" },
    ],
  },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

type SweetenersPageClientProps = {
  productImageMap?: ImageMap;
};

function openWhatsApp(product?: WhatsAppProduct) {
  const msg = product
    ? `Hello SriLaYa Naturals,\n\nI'm interested in ${product.name}. Could you share pricing and availability? Thank you!`
    : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Natural Sweeteners collection. Could you help me?";
  window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
}

export default function SweetenersPageClient({ productImageMap = {} }: SweetenersPageClientProps) {
  function getProductImage(keyword: string): string | null {
    const entry = Object.entries(productImageMap).find(([title]) =>
      title.includes(keyword.toLowerCase())
    );
    return entry ? entry[1] : null;
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-100/70 via-amber-50/30 to-[#FDFBF7] py-16 md:py-24 border-b border-amber-200/50">
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
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D99B26]/15 text-[#5C3A21] font-bold text-xs uppercase tracking-wider mb-6 border border-[#D99B26]/30">
            <Drop className="w-4 h-4" weight="regular" /> Natural Jaggery & Sweeteners
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            Sweet Without<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              the Guilt.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s <strong className="text-[#5C3A21]">Natural Sweeteners collection</strong> — four
            unrefined sweeteners crafted to sweeten your life the way nature intended.
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
              ["Zero Chemicals", "Pure & Natural"],
              ["Low GI Options", "Diabetic Friendly"],
              ["Mineral Rich", "Unrefined Goodness"],
              ["4 Varieties", "One Collection"],
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
              Our Natural Sweeteners Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              Four natural sweeteners — each sourced and processed differently, each with its own unique health profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUCTS.map((p) => {
              const imgUrl = getProductImage(p.keyword);
              return (
                <div
                  key={p.id}
                  className="bg-white/90 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
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
                      <Drop className="w-14 h-14" weight="regular" style={{ color: p.accent }} />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-serif text-2xl font-bold mb-1" style={{ color: p.accent }}>
                      {p.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#2E6F40] uppercase tracking-wider mb-4">{p.local}</p>

                    <ul className="space-y-2 text-sm text-gray-700 mb-5">
                      {p.benefits.map((b) => (
                        <li key={b.label} className="flex items-start gap-2">
                          <span className="text-[#2E6F40] mt-0.5 text-xs">✔</span>
                          <span><strong>{b.label}</strong> — {b.desc}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className="text-xs px-3 py-2 rounded-lg mb-4 italic text-gray-600"
                      style={{ backgroundColor: p.accentLight }}
                    >
                      <Factory size={13} weight="regular" className="inline-block mr-1" />{p.production}
                    </div>

                    <button
                      onClick={() => openWhatsApp(p)}
                      className="w-full py-2.5 bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white text-[#1a9e4a] font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-[#25D366]/40 mt-auto"
                    >
                      <WhatsappLogo size={15} weight="fill" className="inline-block mr-1" />Enquire on WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Natural Sweeteners */}
        <section className="bg-gradient-to-r from-[#5C3A21] to-[#D99B26] text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-white font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Wellness First
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              Why Ditch Refined Sugar?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              Every spoon of refined sugar is empty calories. Every spoon of jaggery powder is minerals, antioxidants, and tradition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Drop, title: "Retains Iron", desc: "Refined sugar strips iron entirely. Jaggery keeps it in every granule." },
              { icon: Microscope, title: "Gut Friendly", desc: "Natural inulin in coconut jaggery feeds your healthy gut bacteria." },
              { icon: TrendDown, title: "Lower GI", desc: "Natural jaggery raises blood sugar more slowly than white sugar." },
              { icon: Leaf, title: "Zero Processing", desc: "No bleaching, no chemicals — just evaporated natural plant sap." },
            ].map((b) => (
              <div
                key={b.title}
                className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 text-center hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow">
                  <b.icon className="w-7 h-7 text-white" weight="regular" />
                </div>
                <h3 className="font-bold text-base mb-1">{b.title}</h3>
                <p className="text-xs text-amber-100">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Uses */}
        <section className="text-center">
          <h2 className="font-serif text-2xl font-bold text-[#5C3A21] mb-2">Use It Everywhere</h2>
          <p className="text-gray-500 text-sm mb-6">A 1:1 substitute for sugar in most recipes — just swap and go.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Filter Coffee & Tea", "Smoothies", "Baking", "Traditional Sweets", "Ladoos", "Curd & Desserts", "Chutneys", "Energy Drinks"].map((use) => (
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
