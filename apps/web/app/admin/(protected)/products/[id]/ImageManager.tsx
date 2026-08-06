"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

type AddMode = "upload" | "url";

export default function ImageManager({ productId, slug }: { productId: string; slug: string }) {
  const [images, setImages]     = useState<ProductImage[]>([]);
  const [mode, setMode]         = useState<AddMode>("upload");
  const [newUrl, setNewUrl]     = useState("");
  const [newAlt, setNewAlt]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [adding, setAdding]     = useState(false);
  const [error, setError]       = useState("");
  const [preview, setPreview]   = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch(`/api/admin/products/${productId}/images`);
    if (res.ok) setImages(await res.json());
  }

  useEffect(() => { load(); }, [productId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setPreview(URL.createObjectURL(f));
    setError("");
  }

  async function saveUrl(url: string) {
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, alt: newAlt.trim() }),
    });
    if (!res.ok) throw new Error("Failed to save image");
    setNewUrl(""); setNewAlt(""); setPreview(null); setFileName("");
    if (fileRef.current) fileRef.current.value = "";
    await load();
  }

  async function uploadAndAdd() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a file"); return; }
    setAdding(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("slug", slug);
      form.append("position", String(images.length));
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      await saveUrl(json.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function addByUrl() {
    if (!newUrl.trim()) return;
    setAdding(true); setError("");
    try {
      await saveUrl(newUrl.trim());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm("Remove this image?")) return;
    await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
    await load();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    const updated = next.map((img, i) => ({ ...img, position: i }));
    setImages(updated);
    setSaving(true);
    await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: updated.map(img => ({ id: img.id, position: img.position, alt: img.alt })) }),
    });
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#212121]">Product Images</h2>
        {saving && <span className="text-xs text-[#9E9E9E]">Saving order…</span>}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-[#F5F5F5] p-1 rounded-lg w-fit">
        {(["upload", "url"] as AddMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-white text-[#212121] shadow-sm"
                : "text-[#757575] hover:text-[#212121]"
            }`}
          >
            {m === "upload" ? "⬆ Upload File" : "🔗 Paste URL"}
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="space-y-3 p-4 bg-[#F9F9F9] rounded-xl border border-[#E0E0E0]">
        {mode === "upload" ? (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#BDBDBD] rounded-xl p-6 text-center cursor-pointer hover:border-[#006A38] hover:bg-[#006A38]/5 transition-colors"
            >
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-28 w-28 rounded-lg overflow-hidden border border-[#E0E0E0]">
                    <Image src={preview} alt="preview" fill className="object-contain" />
                  </div>
                  <span className="text-xs text-[#616161] truncate max-w-[180px]">{fileName}</span>
                  <span className="text-xs text-[#006A38] font-semibold">Click to change</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl mb-2">📷</p>
                  <p className="text-sm font-semibold text-[#424242]">Click to select image</p>
                  <p className="text-xs text-[#9E9E9E] mt-1">JPEG, PNG, WebP · max 5 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        ) : (
          <input
            type="url"
            placeholder="https://… (image URL)"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006A38]/30"
          />
        )}

        <input
          type="text"
          placeholder="Alt text (optional)"
          value={newAlt}
          onChange={e => setNewAlt(e.target.value)}
          className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006A38]/30"
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={mode === "upload" ? uploadAndAdd : addByUrl}
          disabled={adding || (mode === "url" && !newUrl.trim()) || (mode === "upload" && !preview)}
          className="bg-[#006A38] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#005A30] transition-colors disabled:opacity-50"
        >
          {adding
            ? mode === "upload" ? "Uploading…" : "Adding…"
            : mode === "upload" ? "Upload & Add" : "+ Add Image"}
        </button>
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <p className="text-sm text-[#9E9E9E] text-center py-6">No images yet. Upload one above.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={img.id} className="relative group border border-[#E0E0E0] rounded-xl overflow-hidden bg-[#F5F5F5]">
              <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {i === 0 ? "Main" : `#${i + 1}`}
              </div>
              <div className="relative h-32 w-full">
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  unoptimized={img.url.startsWith("http")}
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  className="bg-white text-[#212121] w-7 h-7 rounded-full text-xs font-bold disabled:opacity-30 hover:bg-[#F5F5F5]"
                  title="Move left">←</button>
                <button onClick={() => deleteImage(img.id)}
                  className="bg-red-500 text-white w-7 h-7 rounded-full text-xs font-bold hover:bg-red-600"
                  title="Delete">✕</button>
                <button onClick={() => move(i, 1)} disabled={i === images.length - 1}
                  className="bg-white text-[#212121] w-7 h-7 rounded-full text-xs font-bold disabled:opacity-30 hover:bg-[#F5F5F5]"
                  title="Move right">→</button>
              </div>
              <div className="px-2 py-1.5 bg-white border-t border-[#E0E0E0]">
                <p className="text-[10px] text-[#9E9E9E] truncate">{img.alt || <span className="italic">No alt text</span>}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-[#9E9E9E]">Hover an image to reorder or delete. The first image is the main gallery image.</p>
    </div>
  );
}
