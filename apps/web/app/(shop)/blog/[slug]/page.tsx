import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug }, select: { title: true, excerpt: true } });
  if (!post) return {};
  return { title: `${post.title} | SriLaYa Enterprises`, description: post.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/blog" className="text-sm text-[#006A38] font-semibold hover:underline inline-flex items-center gap-1 mb-6">
        ← Back to Blog
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-bold text-[#006A38] bg-[#E8F5E9] px-2 py-0.5 rounded-full capitalize">{post.category}</span>
        <span className="text-xs text-[#9E9E9E]">{post.readMins} min read</span>
        {post.publishedAt && (
          <span className="text-xs text-[#BDBDBD]">
            {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-black text-[#212121] leading-tight mb-4">{post.title}</h1>
      {post.excerpt && <p className="text-lg text-[#757575] mb-6 leading-relaxed">{post.excerpt}</p>}

      {post.image && (
        <div className="relative h-64 rounded-2xl overflow-hidden mb-8 bg-[#F5F5F5]">
          <Image src={post.image} alt={post.title} fill className="object-cover" unoptimized />
        </div>
      )}

      <article className="prose prose-green max-w-none text-[#424242] leading-relaxed whitespace-pre-wrap">
        {post.content}
      </article>

      <div className="mt-10 pt-8 border-t border-[#F0F0F0]">
        <Link href="/blog" className="text-sm text-[#006A38] font-semibold hover:underline">← More articles</Link>
      </div>
    </main>
  );
}
