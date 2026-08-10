"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grains, ShoppingCart, Leaf, Drop, TrendDown, Heartbeat, Lightning, WhatsappLogo } from "@phosphor-icons/react";

const PHONE = "918660321315";

const MILLET_VARIETIES = [
  {
    id: "foxtail",
    name: "Foxtail Rice",
    keyword: "foxtail rice",
    local: "Navane / Thinai / Kangni",
    badge: "Top Seller",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#D99B26",
    tags: ["millet", "diabetic", "heart"],
    benefits: [
      { label: "Low GI", desc: "Steady blood sugar, no spikes" },
      { label: "Heart Healthy", desc: "Natural plant sterols" },
      { label: "High Fibre", desc: "Supports weight management" },
    ],
  },
  {
    id: "little",
    name: "Little Rice",
    keyword: "little rice",
    local: "Samai / Same / Kutki",
    badge: "Digestive Care",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    tags: ["millet", "digestive"],
    benefits: [
      { label: "Gentle on Digestion", desc: "Easiest millet on the stomach" },
      { label: "Antioxidant Rich", desc: "Fights inflammation" },
      { label: "Light & Fluffy", desc: "Cooks like white rice" },
    ],
  },
  {
    id: "kodo",
    name: "Kodo Rice",
    keyword: "kodo rice",
    local: "Varagu / Kodra / Arikelu",
    badge: "Diabetic Friendly",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    accent: "#6d28d9",
    tags: ["millet", "diabetic"],
    benefits: [
      { label: "Proven Blood Sugar Control", desc: "Clinically reduces glucose levels" },
      { label: "Fibre Dense", desc: "Detox & longer satiety" },
      { label: "Cell Protection", desc: "Antioxidants guard against damage" },
    ],
  },
  {
    id: "barnyard",
    name: "Barnyard Rice",
    keyword: "barnyard rice",
    local: "Kuthiraivali / Sanwa / Oudalu",
    badge: "Lowest GI",
    badgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    accent: "#f97316",
    tags: ["millet", "diabetic", "weight"],
    benefits: [
      { label: "Lowest GI of All Millets", desc: "Best choice for diabetes management" },
      { label: "High Satiety", desc: "Fills you up, reduces overeating" },
      { label: "Fast Cooking", desc: "Ready in under 15 minutes" },
    ],
  },
  {
    id: "browntop",
    name: "Browntop Rice",
    keyword: "browntop rice",
    local: "Korale / Andu Korralu / Chama",
    badge: "Gut Health",
    badgeColor: "bg-lime-50 text-lime-800 border-lime-200",
    accent: "#65a30d",
    tags: ["millet", "digestive", "diabetic"],
    benefits: [
      { label: "Highest Fibre Millet", desc: "Exceptional gut and colon health" },
      { label: "Low GI", desc: "Blood sugar friendly" },
      { label: "Rich in Minerals", desc: "Calcium, iron & phosphorus" },
    ],
  },
  {
    id: "pearl",
    name: "Pearl Rice",
    keyword: "pearl rice",
    local: "Kambu / Bajra / Sajje",
    badge: "Vitality",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "#b45309",
    tags: ["millet", "heart", "family"],
    benefits: [
      { label: "Iron & Mineral Dense", desc: "Boosts energy and vitality" },
      { label: "Heart Protective", desc: "Rich in potassium" },
      { label: "Metabolic Booster", desc: "Ignites daily metabolism" },
    ],
  },
  {
    id: "ragi",
    name: "Ragi Rice",
    keyword: "ragi rice",
    local: "Kezhvaragu / Finger Millet / Nachni",
    badge: "Calcium Rich",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    accent: "#5C3A21",
    tags: ["millet", "family", "bone"],
    benefits: [
      { label: "Highest Plant Calcium", desc: "Stronger bones & teeth" },
      { label: "Iron Rich", desc: "Fights anaemia naturally" },
      { label: "Natural Relaxant", desc: "Tryptophan aids sleep" },
    ],
  },
  {
    id: "white-sorghum",
    name: "White Sorghum Rice",
    keyword: "white sorghum rice",
    local: "Jowar / Cholam / Jola",
    badge: "Gut Friendly",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#d97706",
    tags: ["millet", "heart", "digestive"],
    benefits: [
      { label: "Prebiotic Fibre", desc: "Feeds healthy gut bacteria" },
      { label: "Heart Healthy", desc: "Natural plant sterols" },
      { label: "Gluten Free", desc: "Safe for gluten intolerance" },
    ],
  },
  {
    id: "red-sorghum",
    name: "R Sorghum",
    keyword: "r sorghum",
    local: "Red Sorghum / Cholam / Jowar",
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
];

const OTHER_GRAINS = [
  {
    id: "sprouted-ragi",
    name: "Sprouted Ragi",
    keyword: "sprouted ragi",
    local: "Molakattu Kezhvaragu / Sprouted Finger Millet",
    badge: "Enhanced Nutrition",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "#2E6F40",
    tags: ["grain", "family", "bone"],
    benefits: [
      { label: "2× Calcium Absorption", desc: "Sprouting boosts bioavailability" },
      { label: "Natural Probiotic Action", desc: "Fermented enzymes aid digestion" },
      { label: "Ideal for Babies & Kids", desc: "Gentle, nutrient-dense first food" },
    ],
  },
  {
    id: "barley",
    name: "Barley Rice",
    keyword: "barley rice",
    local: "Jau / Yava / Barlai",
    badge: "Beta-Glucan",
    badgeColor: "bg-green-50 text-green-800 border-green-200",
    accent: "#15803d",
    tags: ["grain", "heart", "diabetic"],
    benefits: [
      { label: "Beta-Glucan Fibre", desc: "Clinically reduces cholesterol" },
      { label: "Blood Sugar Control", desc: "Slow, steady glucose release" },
      { label: "Gut Microbiome", desc: "Prebiotic that feeds good bacteria" },
    ],
  },
  {
    id: "wheat",
    name: "Wheat",
    keyword: "wheat",
    local: "Gehun / Godhi / Godhuma",
    badge: "Whole Grain",
    badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    accent: "#ca8a04",
    tags: ["grain", "family"],
    benefits: [
      { label: "Whole Grain Goodness", desc: "Full bran retained, zero refining" },
      { label: "High Dietary Fibre", desc: "Supports gut and heart health" },
      { label: "Complex Carbs", desc: "Sustained energy for the day" },
    ],
  },
];

const ALL_PRODUCTS = [...MILLET_VARIETIES, ...OTHER_GRAINS];

const FILTER_OPTIONS = [
  { key: "all", label: "All Varieties" },
  { key: "millet", label: "Millet Varieties" },
  { key: "grain", label: "Other Whole Grains" },
  { key: "diabetic", label: "Diabetic Care" },
  { key: "heart", label: "Heart Health" },
  { key: "family", label: "Kids & Family" },
  { key: "digestive", label: "Digestive Care" },
];

type ImageMap = Record<string, string>;
type WhatsAppProduct = { name: string };

export default function RicePageClient({ productImageMap = {} }: { productImageMap?: ImageMap }) {
  const [activeFilter, setActiveFilter] = useState("all");

  function getProductImage(keyword: string): string | null {
    const entry = Object.entries(productImageMap).find(([title]) =>
      title.includes(keyword.toLowerCase())
    );
    return entry ? entry[1] : null;
  }

  const visibleMillet = MILLET_VARIETIES.filter(p =>
    activeFilter === "all" || activeFilter === "millet" ? true : p.tags.includes(activeFilter)
  );
  const visibleGrain = OTHER_GRAINS.filter(p =>
    activeFilter === "all" || activeFilter === "grain" ? true : p.tags.includes(activeFilter)
  );
  const totalVisible = visibleMillet.length + visibleGrain.length;

  function openWhatsApp(product?: WhatsAppProduct) {
    const msg = product
      ? `Hello SriLaYa Naturals,\n\nI'm interested in ${product.name}. Could you share pricing and availability? Thank you!`
      : "Hello SriLaYa Naturals,\n\nI'd like to enquire about your Millet Rice collection. Could you help me?";
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
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-100/60 via-emerald-50/30 to-[#FDFBF7] py-16 md:py-24 border-b border-emerald-200/50">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(#2E6F40 0.75px, transparent 0.75px), radial-gradient(#2E6F40 0.75px, #fdfbf7 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2E6F40]/10 text-[#2E6F40] font-bold text-xs uppercase tracking-wider mb-6 border border-[#2E6F40]/20">
            <Grains className="w-4 h-4" weight="regular" /> Whole Grain Millet Varieties
          </span>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#5C3A21] leading-tight max-w-4xl mx-auto mb-4">
            Replace White Rice.<br className="hidden sm:block" />
            <span className="text-[#2E6F40] underline decoration-[#D99B26] decoration-wavy decoration-2">
              Reclaim Your Health.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            SriLaYa&apos;s complete <strong className="text-[#5C3A21]">Millet Rice collection</strong> — 12 whole
            grain varieties that cook just like rice, with a fraction of the glycemic load.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <a
              href="#collection"
              className="bg-[#2E6F40] hover:bg-[#5C3A21] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
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
              ["12 Varieties", "One Collection"],
              ["Low GI", "Diabetic Friendly"],
              ["Cooks Like Rice", "Easy Switch"],
              ["No Polishing", "Full Nutrition Intact"],
            ].map(([title, sub]) => (
              <div key={title} className="p-3 bg-white/80 rounded-lg border border-emerald-200/60 text-center shadow-sm">
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
              Our Millet Rice Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm">
              12 whole grain varieties — swap white rice for any of these and keep all the texture with a fraction of the glycemic load.
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

          {totalVisible === 0 && (
            <p className="text-center text-gray-400 py-12">No varieties match this filter.</p>
          )}

          {/* Millet Varieties */}
          {visibleMillet.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px flex-1 bg-emerald-200" />
                <h3 className="text-xs font-bold text-[#2E6F40] uppercase tracking-widest whitespace-nowrap">
                  Millet Varieties ({visibleMillet.length})
                </h3>
                <span className="h-px flex-1 bg-emerald-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleMillet.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {/* Other Whole Grains */}
          {visibleGrain.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px flex-1 bg-amber-200" />
                <h3 className="text-xs font-bold text-[#5C3A21] uppercase tracking-widest whitespace-nowrap">
                  Other Whole Grains ({visibleGrain.length})
                </h3>
                <span className="h-px flex-1 bg-amber-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleGrain.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </section>

        {/* How to cook */}
        <section className="bg-[#F9F6F0] border border-amber-100 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#5C3A21]">How to Cook Millet Rice</h2>
            <p className="text-gray-500 text-sm mt-1">Same as white rice — just a few extra minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Rinse & Soak",
                desc: "Rinse millet 2–3 times until water runs clear. Soak for 30 minutes (optional but speeds cooking and improves digestibility).",
                color: "#2E6F40",
              },
              {
                step: "02",
                title: "Cook",
                desc: "Use a 1:2.5 ratio (1 cup millet : 2.5 cups water). Bring to boil, reduce to low flame, cover and cook for 15–20 minutes until water is absorbed.",
                color: "#D99B26",
              },
              {
                step: "03",
                title: "Rest & Serve",
                desc: "Turn off heat, keep covered for 5 minutes. Fluff with a fork. Serve in place of white rice with any curry, dal, or sabzi.",
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
              Why Switch to Millet Rice?
            </h2>
            <p className="text-amber-100 mt-2 text-sm">
              What you gain when you replace polished white rice with whole grain millets.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: TrendDown, title: "Low GI", desc: "Millets raise blood sugar 50–70% less than white rice — ideal for diabetics." },
              { icon: Grains, title: "Bran Intact", desc: "Zero polishing means all fibre, vitamins, and minerals stay in every grain." },
              { icon: Drop, title: "Mineral Dense", desc: "Iron, calcium, magnesium, zinc — nutrients stripped from polished white rice." },
              { icon: Lightning, title: "Longer Satiety", desc: "High fibre content keeps you fuller for longer, reducing total calorie intake." },
              { icon: Heartbeat, title: "Heart Friendly", desc: "Natural plant sterols and low glycemic load support cardiovascular health." },
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
