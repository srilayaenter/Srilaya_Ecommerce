import { prisma } from "@/lib/db";
import Link from "next/link";
import { ThumbsUp, BowlFood } from "@phosphor-icons/react/dist/ssr";
import RecipeCardImage from "@/components/RecipeCardImage";

// Recipe images are served from Supabase Storage (production bucket, public).
// To add or update a photo — NO code change needed:
//   1. Go to Supabase Dashboard → Storage → recipe-images bucket (project szsrdtiphbdpdfggxwpw)
//   2. Upload (or overwrite) the file with the exact filename listed below
//   3. The image appears on this page immediately — no deploy required
//
// Filenames:
//   millet-upma.jpg   → Millet Upma card
//   rava-kheer.jpg    → Rava Kheer card
//   millet-pongal.jpg → Millet Pongal card

const RECIPE_IMG = "https://szsrdtiphbdpdfggxwpw.supabase.co/storage/v1/object/public/recipe-images";

const FEATURED_FLOUR_RECIPES = [
  {
    title: "Millet Roti & Chapati",
    tag: "Daily Staple",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-roti.jpg` : "",
    readMins: 20,
    excerpt: "Soft, wholesome flatbread made with millet flour — a nutritious daily swap for refined wheat rotis.",
    desc: "Mix millet flour with warm water, a pinch of salt, and a teaspoon of oil. Knead into a soft dough and rest 10 minutes. Roll out thin circles and cook on a hot tawa for 1–2 mins each side until light golden spots appear. Serve hot with ghee, dal, or vegetable curry.",
    best: "Any millet flour",
  },
  {
    title: "Millet Dosa & Uttapam",
    tag: "Instant Breakfast",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-dosa.jpg` : "",
    readMins: 15,
    excerpt: "Crispy instant dosas and soft uttapams made from millet flour — no fermentation needed, ready in minutes.",
    desc: "Whisk millet flour with water, salt, cumin, and green chilli into a smooth pourable batter (thinner for dosa, thicker for uttapam). Heat a greased tawa, spread thin for dosa or pour thick and top with onions, tomatoes, and coriander for uttapam. Cook until done. Serve with coconut chutney or sambar.",
    best: "Any millet flour",
  },
  {
    title: "Millet Puttu",
    tag: "South Indian Classic",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-puttu.jpg` : "",
    readMins: 20,
    excerpt: "A steamed South Indian breakfast with millet flour layered with grated coconut — fluffy and filling.",
    desc: "Lightly roast millet flour until nutty. Mix with grated coconut, a pinch of salt, and just enough water for a moist crumbly texture. Pack into a puttu maker in alternating layers of flour and coconut. Steam for 10–12 minutes until firm. Serve with kadala curry, banana, or jaggery.",
    best: "Finger (Ragi) flour or Foxtail flour",
  },
  {
    title: "Millet Kheer & Porridge",
    tag: "Comfort Dessert",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-kheer.jpg` : "",
    readMins: 20,
    excerpt: "A rich, creamy kheer or warming porridge made with millet flour, milk, and natural sweeteners — no soaking required.",
    desc: "Whisk millet flour into warm milk to avoid lumps. Simmer on low heat, stirring continuously, until thickened. Sweeten with jaggery powder, flavour with crushed cardamom and a pinch of dry ginger, and garnish with ghee-roasted cashews and raisins. For porridge, use water instead of milk.",
    best: "Any millet flour",
  },
  {
    title: "Traditional Millet Ladoos",
    tag: "Festive Sweet",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-ladoo.jpg` : "",
    readMins: 30,
    excerpt: "Handcrafted millet ladoos with roasted flour, jaggery, and ghee — a traditional sweet that keeps well for days.",
    desc: "Dry roast millet flour on low heat for 8–10 minutes until aromatic and lightly golden. Cool, then mix with melted jaggery, ghee, crushed cardamom, and chopped nuts. While warm, shape into firm round ladoos. Add a spoon of warm ghee if the mixture is too dry. Store in an airtight container for up to a week.",
    best: "Any millet flour — Ragi and Foxtail are traditional favourites",
  },
  {
    title: "Millet Healthy Bakes",
    tag: "Guilt-Free Snack",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-bakes.jpg` : "",
    readMins: 30,
    excerpt: "Soft, moist millet flour muffins and cookies — wholesome guilt-free bakes with no maida, no refined sugar.",
    desc: "Mix millet flour with baking powder, salt, and add-ins (banana, dates, nuts, or cocoa). Combine with eggs or flax egg, coconut oil, and jaggery powder. Fold gently — do not overmix. Pour into a greased muffin tray or shape into cookies and bake at 180°C for 18–22 minutes until a toothpick comes out clean.",
    best: "Any millet flour — Kodo or Barnyard gives a lighter crumb",
  },
];

const FEATURED_RECIPES = [
  {
    title: "Millet Upma",
    tag: "Breakfast Classic",
    image: RECIPE_IMG ? `${RECIPE_IMG}/millet-upma.jpg` : "",
    readMins: 15,
    excerpt: "A quick, nutritious start to your day using roasted millet rava with fresh vegetables and ghee.",
    desc: "Dry roast millet rava for 2–3 mins. Sauté mustard, cumin, green chillies, ginger, curry leaves, and chopped vegetables in ghee. Add 2.5 cups water, salt, bring to boil, add roasted rava, cover and cook on low flame for 7–8 mins.",
    best: "Foxtail, Barnyard, or Little Rava",
  },
  {
    title: "Rava Kheer",
    tag: "Guilt-Free Dessert",
    image: RECIPE_IMG ? `${RECIPE_IMG}/rava-kheer.jpg` : "",
    readMins: 20,
    excerpt: "A rich, creamy guilt-free dessert made with millet rava, coconut milk, and jaggery.",
    desc: "Gently roast millet rava in ghee. Simmer with fresh milk or coconut milk until thick and creamy. Flavour with crushed cardamom, jaggery or natural sweetener, and garnish with ghee-roasted cashews and raisins.",
    best: "Finger Rava, Pearl Rava, or Sorghum Rava",
  },
  {
    title: "Millet Pongal",
    tag: "Savory Comfort",
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
  let recipes: { id: string; slug: string; title: string; excerpt: string | null; image: string | null; readMins: number | null; publishedAt: Date | null }[] = [];
  try {
    recipes = await prisma.blogPost.findMany({
      where:   { published: true, category: "recipe" },
      orderBy: { publishedAt: "desc" },
      select:  { id: true, slug: true, title: true, excerpt: true, image: true, readMins: true, publishedAt: true },
    });
  } catch {}

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
                <RecipeCardImage src={r.image} alt={r.title} tag={r.tag} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#006A38] bg-[#E8F5E9] px-2 py-0.5 rounded-full">Recipe</span>
                    <span className="text-xs text-[#9E9E9E]">{r.readMins} min</span>
                  </div>
                  <h2 className="font-black text-[#212121] leading-snug mb-1">{r.title}</h2>
                  <p className="text-sm text-[#757575] line-clamp-2 mb-3">{r.excerpt}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{r.desc}</p>
                  <div className="text-xs font-semibold text-[#006A38] bg-[#E8F5E9] px-3 py-2 rounded-lg">
                    <ThumbsUp size={12} weight="regular" className="inline-block mr-1" />Best with: {r.best}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Static featured millet flour recipes */}
        <div className="mb-10">
          <h2 className="text-sm font-bold text-[#006A38] uppercase tracking-widest mb-4">Featured Millet Flour Recipes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_FLOUR_RECIPES.map((r) => (
              <div key={r.title} className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-sm">
                <RecipeCardImage src={r.image} alt={r.title} tag={r.tag} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#5C3A21] bg-[#FDF0E8] px-2 py-0.5 rounded-full">Recipe</span>
                    <span className="text-xs text-[#9E9E9E]">{r.readMins} min</span>
                  </div>
                  <h2 className="font-black text-[#212121] leading-snug mb-1">{r.title}</h2>
                  <p className="text-sm text-[#757575] line-clamp-2 mb-3">{r.excerpt}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{r.desc}</p>
                  <div className="text-xs font-semibold text-[#5C3A21] bg-[#FDF0E8] px-3 py-2 rounded-lg">
                    <ThumbsUp size={12} weight="regular" className="inline-block mr-1" />Best with: {r.best}
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
                    <BowlFood size={52} weight="regular" className="text-[#2E6F40]" />
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
