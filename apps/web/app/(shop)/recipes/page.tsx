import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

// Recipe images are served from Supabase Storage (bucket: "recipe-images", public).
// To add or update a photo — NO code change needed:
//   1. Go to Supabase Dashboard → Storage → recipe-images bucket
//   2. Upload (or overwrite) the file with the exact filename listed below
//   3. The image appears on this page immediately — no deploy required
//
// Filenames:
//   millet-upma.jpg   → Millet Upma card
//   rava-kheer.jpg    → Rava Kheer card
//   millet-pongal.jpg → Millet Pongal card
//
// Requires NEXT_PUBLIC_SUPABASE_URL in Vercel env vars (and local .env):
//   NEXT_PUBLIC_SUPABASE_URL=https://szsrdtiphbdpdfggxwpw.supabase.co

const _base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const RECIPE_IMG = _base
  ? `${_base}/storage/v1/object/public/recipe-images`
  : null;

const FEATURED_RECIPES = [
  {
    title: "Millet Upma",
    tag: "Breakfast Classic",
    emoji: "🍲",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-upma.jpg` : "",
    readMins: 15,
    excerpt: "A quick, nutritious start to your day using roasted millet rava with fresh vegetables and ghee.",
    desc: "Dry roast millet rava for 2–3 mins. Sauté mustard, cumin, green chillies, ginger, curry leaves, and chopped vegetables in ghee. Add 2.5 cups water, salt, bring to boil, add roasted rava, cover and cook on low flame for 7–8 mins.",
    best: "Foxtail, Barnyard, or Little Rava",
  },
  {
    title: "Rava Kheer",
    tag: "Guilt-Free Dessert",
    emoji: "🍮",
    image: RECIPE_IMG ? `${RECIPE_IMG}/rava-kheer.jpg` : "",
    readMins: 20,
    excerpt: "A rich, creamy guilt-free dessert made with millet rava, coconut milk, and jaggery.",
    desc: "Gently roast millet rava in ghee. Simmer with fresh milk or coconut milk until thick and creamy. Flavour with crushed cardamom, jaggery or natural sweetener, and garnish with ghee-roasted cashews and raisins.",
    best: "Finger Rava, Pearl Rava, or Sorghum Rava",
  },
  {
    title: "Millet Pongal",
    tag: "Savory Comfort",
    emoji: "🫕",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-pongal.jpg` : "",
    readMins: 25,
    excerpt: "Wholesome savory pongal with millet rava and yellow moong dal, tempered in ghee with pepper and cashews.",
    desc: "Pressure cook roasted yellow moong dal. Cook millet rava in 3 cups water until soft. Combine cooked dal and rava, then temper in ghee with crushed black pepper, cumin seeds, ginger, cashews, and fresh curry leaves.",
    best: "Mapillai Samba Rava or Little Rava",
  },
];

export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Millet Recipes",
  description: "Quick, family-friendly millet recipes from SriLaYa Naturals — ready in under 20 minutes.",
};

export default async function RecipesPage() {
  const recipes = await prisma.blogPost.findMany({
    where:   { published: true, category: "recipe" },
    orderBy: { publishedAt: "desc" },
    select:  { id: true, slug: true, title: true, excerpt: true, image: true, readMins: true, publishedAt: true },
  });

  return (
    <main className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins">Millet Recipes</h1>
        <p className="text-[#FFF8E1] text-sm mt-1 max-w-md mx-auto">
          Quick, wholesome recipes using SriLaYa millets — most ready in under 20 minutes.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Static featured millet rava recipes */}
        <div className="mb-10">
          <h2 className="text-sm font-bold text-[#006A38] uppercase tracking-widest mb-4">Featured Millet Rava Recipes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_RECIPES.map((r) => (
              <div key={r.title} className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-sm">
                {r.image ? (
                  <div className="relative h-44 bg-[#F5F5F5]">
                    <Image src={r.image} alt={r.title} fill className="object-cover" unoptimized />
                    <span className="absolute top-3 left-3 text-xs font-bold text-[#006A38] bg-white/90 px-3 py-0.5 rounded-full">{r.tag}</span>
                  </div>
                ) : (
                <div className="h-44 bg-gradient-to-br from-[#E8F5E9] to-[#A5D6A7] flex flex-col items-center justify-center gap-2">
                  <span className="text-5xl">{r.emoji}</span>
                  <span className="text-xs font-bold text-[#006A38] bg-white/70 px-3 py-0.5 rounded-full">{r.tag}</span>
                </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#006A38] bg-[#E8F5E9] px-2 py-0.5 rounded-full">Recipe</span>
                    <span className="text-xs text-[#9E9E9E]">{r.readMins} min</span>
                  </div>
                  <h2 className="font-black text-[#212121] leading-snug mb-1">{r.title}</h2>
                  <p className="text-sm text-[#757575] line-clamp-2 mb-3">{r.excerpt}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{r.desc}</p>
                  <div className="text-xs font-semibold text-[#006A38] bg-[#E8F5E9] px-3 py-2 rounded-lg">
                    👍 Best with: {r.best}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider before DB recipes */}
        {recipes.length > 0 && (
          <h2 className="text-sm font-bold text-[#006A38] uppercase tracking-widest mb-4">More Recipes</h2>
        )}

        {recipes.length === 0 ? null : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/blog/${recipe.slug}`}
                className="group bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden hover:shadow-md transition-shadow"
              >
                {recipe.image ? (
                  <div className="relative h-44 bg-[#F5F5F5]">
                    <Image src={recipe.image} alt={recipe.title} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-[#E8F5E9] to-[#A5D6A7] flex items-center justify-center">
                    <span className="text-5xl">🍱</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#006A38] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                      Recipe
                    </span>
                    <span className="text-xs text-[#9E9E9E]">{recipe.readMins} min read</span>
                  </div>
                  <h2 className="font-black text-[#212121] group-hover:text-[#006A38] transition-colors leading-snug">
                    {recipe.title}
                  </h2>
                  {recipe.excerpt && (
                    <p className="text-sm text-[#757575] mt-1.5 line-clamp-2">{recipe.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/blog" className="text-sm text-[#006A38] font-semibold hover:underline">
            ← All articles &amp; health guides
          </Link>
        </div>
      </div>
    </main>
  );
}
