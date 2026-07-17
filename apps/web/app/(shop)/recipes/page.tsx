import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
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
        {recipes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">🍱</p>
            <p className="font-bold text-[#212121]">Recipes coming soon.</p>
            <p className="text-sm text-[#424242] mt-1">Check back shortly!</p>
          </div>
        ) : (
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
