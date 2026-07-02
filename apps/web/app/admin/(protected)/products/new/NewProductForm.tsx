"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Category → short uppercase prefix used in SKU
function categoryPrefix(catName: string): string {
  const MAP: Record<string, string> = {
    "spices":         "SPC",
    "flours":         "FLR",
    "flour":          "FLR",
    "grains":         "GRN",
    "grain":          "GRN",
    "pulses":         "PLS",
    "oils":           "OIL",
    "oil":            "OIL",
    "sweeteners":     "SWT",
    "dry fruits":     "DRF",
    "nuts":           "NUT",
    "seeds":          "SED",
    "tea":            "TEA",
    "herbal":         "HRB",
    "superfoods":     "SUP",
    "salt":           "SLT",
    "rice":           "RCE",
    "sugar":          "SGR",
    "honey":          "HNY",
    "ghee":           "GHE",
  };
  const key = catName.toLowerCase().trim();
  for (const [k, v] of Object.entries(MAP)) {
    if (key.includes(k)) return v;
  }
  // Fallback: first 3 consonants/letters of category name
  return catName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
}

function titleToCode(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .map(w => w.slice(0, 4))
    .slice(0, 2)
    .join("");
}

function generateSku(catName: string, title: string): string {
  if (!catName || !title) return "";
  const prefix = categoryPrefix(catName);
  const code   = titleToCode(title);
  return code ? `${prefix}-${code}` : prefix;
}

export default function NewProductForm({
  categories,
  action,
}: {
  categories: Category[];
  action: (fd: FormData) => Promise<void>;
}) {
  const [title,    setTitle]    = useState("");
  const [catId,    setCatId]    = useState("");
  const [sku,      setSku]      = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [size,     setSize]     = useState("");

  const selectedCat = categories.find(c => c.id === catId);

  // Auto-generate SKU when category or title changes (unless user edited it manually)
  useEffect(() => {
    if (skuTouched) return;
    const generated = generateSku(selectedCat?.name ?? "", title);
    setSku(generated);
  }, [catId, title, skuTouched, selectedCat?.name]);

  const variantSkuPreview = sku && size
    ? `${sku}-${size.toUpperCase().replace(/\s+/g, "")}`
    : sku
    ? `${sku}-{SIZE}`
    : "";

  return (
    <form action={action} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">

        {/* Basic info */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 border-b pb-2">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Title *</label>
              <input
                type="text" name="title" required
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  name="categoryId" required
                  value={catId} onChange={e => setCatId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Select…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST Rate (%) *</label>
                <input type="number" name="gstRate" defaultValue="0" className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" className="w-full border rounded-lg px-3 py-2" rows={3} />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
          <h2 className="font-semibold mb-4 border-b pb-2">Product Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certification</label>
              <input type="text" name="certification" placeholder="e.g. FSSAI, Organic India" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shelf Life</label>
              <input type="text" name="shelfLife" placeholder="e.g. 12 months" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Storage</label>
              <input type="text" name="storage" placeholder="e.g. Cool dry place" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nutritional Info</label>
              <input type="text" name="nutritionalInfo" placeholder="e.g. Per 100g: 300kcal" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
        </div>

        {/* Packaging & Stock */}
        <div className="bg-[#FFF8E1] rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
          <h2 className="font-semibold text-[#8D6E63] mb-4 border-b border-[#E0E0E0] pb-2">Packaging & Stock</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Weight/Size *</label>
              <input
                type="text" name="size" required placeholder="e.g. 500g"
                value={size} onChange={e => setSize(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <input type="number" name="price" required step="0.01" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initial Stock *</label>
              <input type="number" name="stock" required className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (grams) *</label>
              <input type="number" name="weightGrams" required defaultValue="500" className="w-full border rounded-lg px-3 py-2" />
              <p className="text-xs text-slate-400 mt-1">Include packaging. Used for shipping cost.</p>
            </div>
          </div>

          {/* SKU field — auto-generated, editable */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Product SKU *</label>
              {!skuTouched && sku && (
                <span className="text-[10px] text-[#006A38] font-bold bg-green-50 px-2 py-0.5 rounded-full">✨ Auto-generated</span>
              )}
              {skuTouched && (
                <button
                  type="button"
                  onClick={() => { setSkuTouched(false); }}
                  className="text-[10px] text-[#8D6E63] underline"
                >
                  Reset to auto
                </button>
              )}
            </div>
            <input
              type="text" name="sku" required
              value={sku}
              onChange={e => { setSku(e.target.value.toUpperCase()); setSkuTouched(true); }}
              placeholder="e.g. SPC-TURM"
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
            />
            {variantSkuPreview && (
              <p className="text-[11px] text-[#9E9E9E] mt-1">
                Variant SKU will be: <span className="font-mono font-bold text-[#006A38]">{variantSkuPreview}</span>
              </p>
            )}
            <p className="text-[11px] text-[#BDBDBD] mt-0.5">Auto-filled from category + title. You can edit it.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Status</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2"><input type="checkbox" name="isActive" defaultChecked /> Active Product</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="isFeatured" /> Featured</label>
          </div>
        </div>

        {selectedCat && sku && (
          <div className="bg-[#F0FAF4] border border-[#006A38]/20 rounded-xl p-4 text-sm space-y-1">
            <p className="font-bold text-[#006A38] text-xs uppercase tracking-wider">SKU Preview</p>
            <p className="font-mono font-bold text-[#212121]">{sku}</p>
            <p className="text-[#8D6E63] text-xs">Category: {selectedCat.name}</p>
            {size && <p className="text-[#8D6E63] text-xs">First variant: <span className="font-mono">{sku}-{size.toUpperCase().replace(/\s+/g, "")}</span></p>}
          </div>
        )}

        <button type="submit" className="w-full bg-[#4CAF50] text-white py-3 rounded-lg font-bold hover:bg-[#388E3C]">
          Save Product
        </button>
      </div>
    </form>
  );
}
