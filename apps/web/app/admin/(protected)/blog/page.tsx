"use client";

import { useEffect, useState } from "react";

interface Post {
  id: string; slug: string; title: string; excerpt: string | null;
  category: string; published: boolean; readMins: number; createdAt: string;
}

const CATEGORIES = ["article", "recipe", "health", "news"];

export default function AdminBlogPage() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ title: "", excerpt: "", content: "", category: "recipe", image: "", readMins: "3", published: false });
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/blog");
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, readMins: Number(form.readMins) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setForm({ title: "", excerpt: "", content: "", category: "recipe", image: "", readMins: "3", published: false });
    setSaving(false);
    load();
  }

  async function togglePublish(post: Post) {
    await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    load();
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await fetch(`/api/admin/blog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setEditing(null);
    setSaving(false);
    load();
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#212121] font-poppins">Blog & Recipes</h1>
        <p className="text-sm text-[#757575] mt-0.5">Publish articles, millet recipes, and health tips for SEO and customer engagement.</p>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-4">
        <h2 className="font-black text-[#212121]">New Post</h2>
        <div className="grid grid-cols-2 gap-4">
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="Post title *" className="col-span-2 border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]" />
          <input value={form.excerpt} onChange={e => setForm(f => ({...f, excerpt: e.target.value}))} placeholder="Short excerpt (shown in listing)" className="col-span-2 border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]" />
          <input value={form.image} onChange={e => setForm(f => ({...f, image: e.target.value}))} placeholder="Cover image URL" className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]" />
          <div className="flex gap-3">
            <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="flex-1 border border-[#E0E0E0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38] bg-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input type="number" min={1} max={60} value={form.readMins} onChange={e => setForm(f => ({...f, readMins: e.target.value}))} placeholder="Mins" className="w-20 border border-[#E0E0E0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38] text-center" />
          </div>
          <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} required rows={6} placeholder="Full content (supports plain text or Markdown) *" className="col-span-2 border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38] resize-y font-mono" />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-[#424242] cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({...f, published: e.target.checked}))} className="w-4 h-4 accent-[#006A38]" />
            Publish immediately
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="bg-[#006A38] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#005A30] transition-colors disabled:opacity-50">
            {saving ? "Saving…" : "Create Post"}
          </button>
        </div>
      </form>

      {/* Posts list */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F0F0F0]">
          <h2 className="font-black text-[#212121]">All Posts ({posts.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[#9E9E9E] text-sm">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-[#9E9E9E] text-sm">No posts yet.</div>
        ) : (
          <div className="divide-y divide-[#F5F5F5]">
            {posts.map(post => (
              <div key={post.id} className="px-6 py-4">
                {editing === post.id ? (
                  <div className="space-y-3">
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} className="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#006A38] resize-y" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(post.id)} disabled={saving} className="bg-[#006A38] text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                      <button onClick={() => setEditing(null)} className="border border-[#E0E0E0] text-[#757575] font-bold px-4 py-2 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold bg-[#F5F5F5] text-[#757575] px-2 py-0.5 rounded-full capitalize">{post.category}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${post.published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {post.published ? "Published" : "Draft"}
                        </span>
                        <span className="text-xs text-[#9E9E9E]">{post.readMins} min read</span>
                      </div>
                      <p className="font-bold text-[#212121] mt-1">{post.title}</p>
                      {post.excerpt && <p className="text-sm text-[#757575] mt-0.5 line-clamp-1">{post.excerpt}</p>}
                      <p className="text-xs text-[#9E9E9E] mt-1">/blog/{post.slug}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => togglePublish(post)} className="text-xs font-bold border border-[#E0E0E0] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#424242]">
                        {post.published ? "Unpublish" : "Publish"}
                      </button>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className="text-xs font-bold border border-[#E0E0E0] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#006A38]">View</a>
                      <button onClick={() => { setEditing(post.id); setEditContent(""); }} className="text-xs font-bold border border-[#E0E0E0] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#424242]">Edit</button>
                      <button onClick={() => deletePost(post.id)} className="text-xs font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-600">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
