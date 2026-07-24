import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Specialty Collections | SriLaYa Naturals",
  description:
    "Explore SriLaYa Naturals' curated grain collections — from 7 Millet Rava varieties to heritage flours, flakes, and more. Every grain, every benefit, one place.",
};

const COLLECTIONS = [
  {
    id: "rava",
    name: "Millet Rava",
    tagline: "7 varieties. One revolution.",
    description:
      "From Foxtail to Mapillai Samba — discover India's most nutrient-dense granular grains. Low GI, high fibre, ready in minutes.",
    href: "/rava",
    emoji: "🌾",
    accent: "#D99B26",
    accentLight: "#FFF8E1",
    badge: "Live",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    highlights: ["Low GI", "Diabetic-friendly", "7 varieties"],
  },
  {
    id: "flakes",
    name: "Millet Flakes",
    tagline: "Instant nutrition, ancient grains.",
    description:
      "Quick-cooking millet flakes for breakfast, snacks, and healthy meal prep. Whole grain goodness in minutes.",
    href: "/category/millet-flakes",
    emoji: "🥣",
    accent: "#2E6F40",
    accentLight: "#E8F5EE",
    badge: "Coming Soon",
    badgeBg: "bg-gray-100 text-gray-500 border-gray-300",
    highlights: ["Quick cook", "High fibre", "Breakfast-ready"],
  },
  {
    id: "flour",
    name: "Millet Flour",
    tagline: "Bake better. Eat smarter.",
    description:
      "Stone-ground millet flours for rotis, dosas, and bakes. Pure, unadulterated, with the full bran intact.",
    href: "/flour",
    emoji: "🫓",
    accent: "#5C3A21",
    accentLight: "#FDF0E8",
    badge: "Live",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    highlights: ["Stone-ground", "8 varieties", "Gluten-free options"],
  },
  {
    id: "raw-millets",
    name: "Whole Millet Grains",
    tagline: "The grain in its purest form.",
    description:
      "8 unpolished whole millet varieties — Foxtail, Finger (Ragi), Little, Barnyard, Kodo, Pearl, Red & White Sorghum. Cook as rice, make porridge, or grind fresh.",
    href: "/raw-millets",
    emoji: "🌾",
    accent: "#2E6F40",
    accentLight: "#ECFDF5",
    badge: "Live",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    highlights: ["8 varieties", "100% unpolished", "Gluten-free"],
  },
  {
    id: "parboiled",
    name: "Parboiled Millets",
    tagline: "More nutrition than raw grain.",
    description:
      "8 parboiled millet varieties — same grains, enhanced nutrition. Traditional Soak → Steam → Dry → Mill process locks in more nutrients than raw millet.",
    href: "/parboiled-millets",
    emoji: "💧",
    accent: "#1e40af",
    accentLight: "#EFF6FF",
    badge: "Live",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    highlights: ["8 varieties", "Enhanced nutrients", "Better digestibility"],
  },
  {
    id: "laddu",
    name: "Millet Laddus",
    tagline: "Traditional taste. Modern nutrition.",
    description:
      "Handcrafted laddus made with millets and natural sweeteners. No refined sugar, no compromise on flavour.",
    href: "/category/laddu",
    emoji: "🍬",
    accent: "#b45309",
    accentLight: "#FEF3C7",
    badge: "Coming Soon",
    badgeBg: "bg-gray-100 text-gray-500 border-gray-300",
    highlights: ["No refined sugar", "Handcrafted", "Festive gifting"],
  },
  {
    id: "malt",
    name: "Malt & Health Mixes",
    tagline: "A wholesome sip for every age.",
    description:
      "Sprouted millet malts and health drink mixes for kids and adults. Energy, immunity, and taste in every spoon.",
    href: "/category/malt-and-health-mixes",
    emoji: "🥛",
    accent: "#0369a1",
    accentLight: "#E0F2FE",
    badge: "Coming Soon",
    badgeBg: "bg-gray-100 text-gray-500 border-gray-300",
    highlights: ["Sprouted grains", "Kid-friendly", "No preservatives"],
  },
  {
    id: "muesli",
    name: "Muesli & Granola",
    tagline: "Wake up to whole grains.",
    description:
      "8 varieties — Honey, Chocolate, Strawberry, Nutty, Fruits, Sugar Free & Stevia. Whole grain toasted, real fruit, no preservatives.",
    href: "/muesli",
    emoji: "🥣",
    accent: "#92400e",
    accentLight: "#FEF3C7",
    badge: "Live",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    highlights: ["8 varieties", "No preservatives", "Diabetic options"],
  },
  {
    id: "rice",
    name: "Traditional Rice",
    tagline: "Rice, reimagined.",
    description:
      "Mapillai Samba, Karupu Kavuni, Poongar & Seeraga Samba — heritage varieties with centuries of tradition and proven wellness benefits.",
    href: "/traditional-rice",
    emoji: "🍚",
    accent: "#9f1239",
    accentLight: "#FFF1F2",
    badge: "Live",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    highlights: ["4 heritage varieties", "Low GI", "Antioxidant rich"],
  },
  {
    id: "sweeteners",
    name: "Natural Sweeteners",
    tagline: "Sweet without the guilt.",
    description:
      "Sugarcane, Palm & Coconut Jaggery Powder — unrefined, mineral-rich, low GI alternatives to refined sugar.",
    href: "/sweeteners",
    emoji: "🍯",
    accent: "#b45309",
    accentLight: "#FEF3C7",
    badge: "Live",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    highlights: ["3 varieties", "Low GI", "Zero chemicals"],
  },
];

export default function CollectionsPage() {
  const liveCount = COLLECTIONS.filter((c) => c.badge === "Live").length;
  const totalCount = COLLECTIONS.length;

  return (
    <div className="bg-[#FDFBF7] min-h-screen text-[#2D2722]">

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#003D20] to-[#006A38] py-16 md:py-20 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(#D99B26 0.75px, transparent 0.75px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-amber-200 font-bold text-xs uppercase tracking-wider mb-5 border border-white/20">
            🌿 SriLaYa Specialty Collections
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Every Grain.<br className="hidden sm:block" />
            <span className="text-[#D99B26]">Every Benefit.</span>
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
            We don't just sell grains — we curate collections around each grain's
            unique story, health benefit, and kitchen use. Find yours below.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-center">
            <div className="bg-white/10 rounded-xl px-6 py-3 border border-white/15">
              <div className="text-2xl font-black text-[#D99B26]">{totalCount}</div>
              <div className="text-xs text-emerald-200 font-semibold uppercase tracking-wide mt-0.5">Collections</div>
            </div>
            <div className="bg-white/10 rounded-xl px-6 py-3 border border-white/15">
              <div className="text-2xl font-black text-[#D99B26]">{liveCount}</div>
              <div className="text-xs text-emerald-200 font-semibold uppercase tracking-wide mt-0.5">Live Now</div>
            </div>
            <div className="bg-white/10 rounded-xl px-6 py-3 border border-white/15">
              <div className="text-2xl font-black text-[#D99B26]">100%</div>
              <div className="text-xs text-emerald-200 font-semibold uppercase tracking-wide mt-0.5">Natural</div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {COLLECTIONS.map((c) => {
            const isLive = c.badge === "Live";
            const Card = (
              <div
                className={`group relative bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${
                  isLive
                    ? "border-[#D99B26]/30 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    : "border-gray-200 opacity-75"
                }`}
                style={{ borderTop: `4px solid ${c.accent}` }}
              >
                {/* Emoji area */}
                <div
                  className="h-32 flex items-center justify-center text-6xl"
                  style={{ backgroundColor: c.accentLight }}
                >
                  {c.emoji}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Badge */}
                  <span
                    className={`self-start text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wide mb-3 ${c.badgeBg}`}
                  >
                    {c.badge}
                  </span>

                  <h2
                    className="font-serif text-xl font-bold mb-1"
                    style={{ color: c.accent }}
                  >
                    {c.name}
                  </h2>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {c.tagline}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
                    {c.description}
                  </p>

                  {/* Highlight chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: c.accentLight,
                          color: c.accent,
                          borderColor: `${c.accent}30`,
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  {isLive ? (
                    <div
                      className="w-full text-center py-2.5 rounded-lg text-sm font-bold transition-colors"
                      style={{
                        backgroundColor: c.accentLight,
                        color: c.accent,
                      }}
                    >
                      Explore Collection →
                    </div>
                  ) : (
                    <div className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
            );

            return isLive ? (
              <Link key={c.id} href={c.href} className="block">
                {Card}
              </Link>
            ) : (
              <div key={c.id}>{Card}</div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-400 mt-12">
          New collections are added as we curate and craft each variety guide.{" "}
          <Link href="/product" className="text-[#006A38] font-semibold hover:underline">
            Browse all products →
          </Link>
        </p>
      </main>
    </div>
  );
}
