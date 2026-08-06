"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface Props {
  productId: string;
  slug: string;
  currentImage: string | null;
}

export default function MainImageUploader({ productId, slug, currentImage }: Props) {
  const [imgSrc, setImgSrc]     = useState(currentImage ?? "");
  const [preview, setPreview]   = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const [saved, setSaved]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setPreview(URL.createObjectURL(f));
    setError(""); setSaved(false);
  }

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a file"); return; }
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("slug", slug);
      const upRes = await fetch("/api/admin/upload", { method: "POST", body: form });
      const upJson = await upRes.json();
      if (!upRes.ok) throw new Error(upJson.error ?? "Upload failed");

      const saveRes = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: upJson.url }),
      });
      if (!saveRes.ok) throw new Error("Failed to save image URL");

      setImgSrc(upJson.url);
      setPreview(null); setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-bold text-[#212121]">Main Product Image</h2>
      <p className="text-xs text-[#9E9E9E]">Shown on product cards and listing pages.</p>

      {/* Current image preview */}
      {imgSrc && !preview && (
        <div className="relative h-40 w-40 rounded-xl overflow-hidden border border-[#E0E0E0] bg-[#F5F5F5]">
          <Image src={imgSrc} alt="Main product image" fill className="object-contain p-2" unoptimized />
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#BDBDBD] rounded-xl p-5 text-center cursor-pointer hover:border-[#006A38] hover:bg-[#006A38]/5 transition-colors"
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
            <p className="text-2xl mb-1">📷</p>
            <p className="text-sm font-semibold text-[#424242]">{imgSrc ? "Click to replace image" : "Click to select image"}</p>
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

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-[#006A38] font-semibold">✓ Main image updated</p>}

      <button
        onClick={upload}
        disabled={uploading || !preview}
        className="bg-[#006A38] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#005A30] transition-colors disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload & Set as Main"}
      </button>
    </div>
  );
}
