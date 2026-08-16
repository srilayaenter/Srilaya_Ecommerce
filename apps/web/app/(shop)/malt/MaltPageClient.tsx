"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coffee, ShoppingCart, Leaf, Drop, Heartbeat, Lightning, WhatsappLogo } from "@phosphor-icons/react";

const PHONE = "918660321315";

const PRODUCTS = [
  {
    id: "sathu-maavu",
    name: "Health Mix (Sathu Maavu)",
    keyword: "health mix",
    local: "Sathu Maavu / Multi-Grain Health Drink",
    badge: "Family Favourite",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    tags: ["all", "family", "kids"],
    desc: "A time-honoured South Indian multigrain mix — roasted grains, legumes, and millets ground together into an instant health drink. One glass delivers what a full breakfast takes an hour to prepare.",
    benefits: [
      { label: "Multi-Grain Nutrition", desc: "15+ grains, millets & legumes in one drink" },
      { label: "Instant to Prepare", desc: "Mix with warm milk or water — ready in 30 seconds" },
      { label: "Safe for All Ages", desc: "From toddlers to elders — gentle & complete" },
    ],
    highlight: "Best for growing children, busy mornings, and elderly nutrition",
  },
  {
    id: "ragi-malt-carrot",
    name: "Ragi Malt Carrot",
    keyword: "ragi malt carrot",
    local: "Kezhvaragu Malt with Carrot / Ragi Carrot Health Drink",
    badge: "Vision & Immunity",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    tags: ["all", "family", "immunity"],
    desc: "Stone-ground finger millet (ragi) enriched with natural carrot powder — a nutrient-dense health drink that combines the highest plant calcium with beta-carotene from carrots.",
    benefits: [
      { label: "Highest Plant Calcium", desc: "Ragi — strongest bone-building millet" },
      { label: "Beta-Carotene Rich", desc: "Carrot adds Vitamin A for eye health & immunity" },
      { label: "Natural Colour & Flavour", desc: "No artificial additives — just real carrot" },
    ],
    highlight: "Ideal for kids' bone development and eye health",
  },
  {
    id: "ragi-malt-beetroot",
    name: "Ragi Malt Beetroot",
    keyword: "ragi malt beetroot",
    local: "Kezhvaragu Malt with Beetroot / Ragi Beet Health Drink",
    badge: "Iron & Energy",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "#be123c",
    tags: ["all", "iron", "immunity"],
    desc: "Finger millet's iron and calcium paired with beetroot's nitrates and natural pigments — a powerful combination for blood health, endurance, and natural energy.",
    benefits: [
      { label: "Iron from Two Sources", desc: "Ragi + beetroot — fights anaemia naturally" },
      { label: "Nitrate Rich", desc: "Beetroot improves blood flow & stamina" },
      { label: "Natural Detox", desc: "Betalains in beetroot support liver health" },
    ],
    highlight: "Perfect for women, athletes, and anyone prone to anaemia",
  },
];

const FILTER_OPTIONS = [
  { key: "all", label: "All Mixes" },
  { key: "kids", label: "Kids & Family" },
  { key: "immunity", label: "Immunity Boost" },
  { key: "iron", label: "Iron & Anaemia" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

export default function MaltPageClient({ productImageMap = {} }: { productImageMap?: ImageMap }) {
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
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Malt & Health Mixes. Could you help me?";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="bg-[#FDFBF7] text-[#2D2722] min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-100/60 via-amber-50/30 to-[#FDFBF7] py-16 md:py-24 border-b border-amber-200/50">
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
            <Coffee className="w-4 h-4" weight="regular" /> Instant Nutrition Drinks
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            One Glass,<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              Complete Nutrition
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s <strong className="text-[#5C3A21]">Malt & Health Mixes</strong> — traditional Sathu Maavu
            and Ragi Malts with natural vegetables. Ready in seconds, no refined sugar, no artificial flavours.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="#collection"
              className="bg-[#5C3A21] hover:bg-[#2E6F40] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" weight="regular" /> Shop Mixes
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
              ["Ready in 30 sec", "Just Add Milk or Water"],
              ["No Refined Sugar", "Naturally Sweetened"],
              ["No Artificial Flavour", "Real Vegetables"],
              ["Safe for All Ages", "Kids to Elderly"],
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
              Our Malt & Health Mix Range
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              Traditional multigrain mixes and fortified ragi malts — each crafted for a specific nutrition goal.
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {visibleProducts.map((p) => {
              const imgUrl = getProductImage(p.keyword);
              return (
                <div
                  key={p.id}
                  className="bg-white/90 backdrop-blur-sm border border-[#D99B26]/15 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
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
                    <div className="h-52 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center relative">
                      <Coffee className="w-16 h-16" weight="regular" style={{ color: p.accent }} />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-serif text-xl font-bold text-[#5C3A21] mb-1">{p.name}</h3>
                    <p className="text-xs font-semibold text-[#2E6F40] uppercase tracking-wider mb-3">{p.local}</p>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{p.desc}</p>
                    <ul className="space-y-2 text-sm text-gray-700 mb-4 flex-1">
                      {p.benefits.map((b) => (
                        <li key={b.label} className="flex items-start gap-2">
                          <span className="text-[#2E6F40] mt-0.5 text-xs">✔</span>
                          <span><strong>{b.label}</strong> — {b.desc}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs font-semibold text-[#D99B26] bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4">
                      💡 {p.highlight}
                    </div>
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

        {/* How to use */}
        <section className="bg-[#F9F6F0] border border-amber-100 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#5C3A21]">How to Prepare</h2>
            <p className="text-gray-500 text-sm mt-1">Three ways to enjoy your daily health mix</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Warm Milk Drink",
                desc: "Mix 2–3 tbsp in a glass of warm milk. Add jaggery or honey to taste. Stir well and serve. Perfect morning drink for kids and adults.",
                color: "#D99B26",
              },
              {
                step: "02",
                title: "Water Porridge",
                desc: "Add 3 tbsp to boiling water, stir continuously for 2 minutes until thick. Season with salt or sweeten with jaggery. Light and filling.",
                color: "#2E6F40",
              },
              {
                step: "03",
                title: "Cold Smoothie",
                desc: "Blend 2 tbsp with cold milk, a banana, and dates for a nutritious breakfast smoothie. No cooking needed.",
                color: "#5C3A21",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div
                  className="text-white font-black text-lg w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: s.color }}
                >
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-[#5C3A21] mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why section */}
        <section className="bg-gradient-to-r from-[#2E6F40] to-emerald-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[#D99B26] font-bold text-xs uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full border border-white/20">
              Wellness First
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold mt-3">
              Why Choose SriLaYa Malts?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              What makes our health mixes better than commercial malt drinks.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Leaf, title: "No Refined Sugar", desc: "Sweetened naturally — coconut jaggery or plain, never refined sugar or HFCS." },
              { icon: Drop, title: "Real Vegetables", desc: "Carrot and beetroot powders are dried whole vegetables — not synthetic vitamins." },
              { icon: Lightning, title: "Multi-Grain Base", desc: "15+ traditional grains, legumes, and millets in every serving of Sathu Maavu." },
              { icon: Heartbeat, title: "No Artificial Flavour", desc: "What you taste is real grain and real vegetable — nothing synthetic." },
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

        {/* Recipes link */}
        <section className="text-center py-4">
          <p className="text-gray-500 text-sm">
            More ways to use your health mix?{" "}
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
