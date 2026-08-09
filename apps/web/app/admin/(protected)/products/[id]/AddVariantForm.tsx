"use client";

import { useState, useEffect } from "react";
import { deriveWeightGramsFromSize } from "@/lib/weight";

export default function AddVariantForm({
  productId,
  action,
}: {
  productId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [size, setSize] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [weightTouched, setWeightTouched] = useState(false);

  // Auto-derive weight (grams) from size (e.g. "500g" -> 500, "1kg" -> 1000)
  // unless the admin has manually overridden it.
  useEffect(() => {
    if (weightTouched) return;
    const derived = deriveWeightGramsFromSize(size);
    if (derived !== null) setWeightGrams(String(derived));
  }, [size, weightTouched]);

  return (
    <form key={productId} action={action} className="grid grid-cols-2 gap-2" autoComplete="off">
      <input type="hidden" name="productId" value={productId} />
      <input
        name="newSize" placeholder="Size (e.g. 500g)" autoComplete="off" required
        value={size} onChange={e => setSize(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      />
      <input type="number" step="0.01" name="newPrice" placeholder="Price (₹)" autoComplete="off" required className="border rounded px-2 py-1 text-sm" />
      <input type="number" name="newStock" placeholder="Stock qty" autoComplete="off" required className="border rounded px-2 py-1 text-sm" />
      <input
        type="number" name="newWeightGrams" placeholder="Weight (g, e.g. 550)" autoComplete="off" required
        value={weightGrams}
        onChange={e => { setWeightGrams(e.target.value); setWeightTouched(true); }}
        className="border rounded px-2 py-1 text-sm"
      />
      <input type="number" name="newReorderThreshold" placeholder="Reorder at (default 10)" autoComplete="off" className="border rounded px-2 py-1 text-sm col-span-2" />
      <button type="submit" className="col-span-2 bg-[#4CAF50] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#388E3C] transition-colors">Add Variant</button>
    </form>
  );
}
