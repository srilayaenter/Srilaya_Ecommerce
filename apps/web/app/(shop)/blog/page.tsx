import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Blog & Recipes | SriLaYa Enterprises" };

const CATEGORY_LABELS: Record<string, string> = {
  recipe: "Recipe", article: "Article", health: "Health & Wellness", news: "News",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, excerpt: true, category: true, image: true, readMins: true, publishedAt: true },
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#212121]">Blog & Recipes</h1>
        <p className="text-[#757575] mt-1">Millet recipes, health tips, and natural living guides from SriLaYa Enterprises.</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-[#9E9E9E]">No posts published yet. Check back soon!</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden hover:shadow-md transition-shadow">
              {post.image ? (
                <div className="relative h-44 bg-[#F5F5F5]">
                  <Image src={post.image} alt={post.title} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center">
                  <span className="text-4xl">{post.category === "recipe" ? "🍱" : post.category === "health" ? "🌿" : "📝"}</span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#006A38] bg-[#E8F5E9] px-2 py-0.5 rounded-full capitalize">
                    {CATEGORY_LABELS[post.category] ?? post.category}
                  </span>
                  <span className="text-xs text-[#9E9E9E]">{post.readMins} min read</span>
                </div>
                <h2 className="font-black text-[#212121] group-hover:text-[#006A38] transition-colors leading-snug">{post.title}</h2>
                {post.excerpt && <p className="text-sm text-[#757575] mt-1.5 line-clamp-2">{post.excerpt}</p>}
                <p className="text-xs text-[#BDBDBD] mt-3">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
