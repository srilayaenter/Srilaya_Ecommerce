'use client';

import { useState } from 'react';

type RecipeLine = {
  id: string;
  qtyPerYield: number;
  rawMaterial: { name: string; unit: string; stockQty: number };
};

type Variant = {
  id: string;
  size: string;
  product: { title: string };
  ladduRecipe: {
    id: string;
    yieldKg: number;
    lines: RecipeLine[];
  } | null;
};

const SIZE_KG: Record<string, number> = {
  '1kg': 1, '500g': 0.5, '250g': 0.25, '200g': 0.2, '2kg': 2,
};

export default function ProductionForm({
  variants,
  action,
}: {
  variants: Variant[];
  action: (fd: FormData) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? '');
  const [units, setUnits] = useState(1);

  const variant = variants.find(v => v.id === selectedId);
  const recipe  = variant?.ladduRecipe;
  const variantKg = SIZE_KG[variant?.size ?? ''] ?? 1;
  const batchesNeeded = recipe ? (units * variantKg) / recipe.yieldKg : 0;

  return (
    <form action={action} className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6 space-y-5 h-fit">
      <h2 className="font-bold text-[#212121]">New Production Batch</h2>

      <div>
        <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Laddu Variant</label>
        <select name="variantId" value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]">
          {variants.map(v => (
            <option key={v.id} value={v.id}>
              {v.product.title} — {v.size}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Units Produced</label>
        <input name="unitsProduced" type="number" min="1" step="1" value={units}
          onChange={e => setUnits(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
        <p className="text-[11px] text-[#9E9E9E] mt-1">
          = {(units * variantKg).toFixed(2)} kg finished product
        </p>
      </div>

      {/* Ingredient deduction preview */}
      {recipe && recipe.lines.length > 0 && (
        <div className="rounded-lg border border-[#E0E0E0] overflow-hidden">
          <div className="bg-[#F5F5F5] px-4 py-2 text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider">
            Ingredients to be deducted
          </div>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-[#F9F9F9]">
              {recipe.lines.map(line => {
                const consumed = batchesNeeded * line.qtyPerYield;
                const remaining = line.rawMaterial.stockQty - consumed;
                const isShort = remaining < 0;
                return (
                  <tr key={line.id} className={isShort ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 font-medium text-[#212121]">{line.rawMaterial.name}</td>
                    <td className={`px-4 py-2 text-right font-mono font-bold ${isShort ? 'text-red-600' : 'text-[#006A38]'}`}>
                      {consumed.toFixed(3)} {line.rawMaterial.unit}
                    </td>
                    <td className="px-4 py-2 text-right text-[#9E9E9E]">
                      {isShort
                        ? <span className="text-red-600 font-bold">⚠ short by {Math.abs(remaining).toFixed(3)}</span>
                        : <span>→ {remaining.toFixed(3)} left</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#9E9E9E] uppercase mb-1">Notes (optional)</label>
        <input name="notes" placeholder="e.g. Batch 12, special occasion"
          className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]" />
      </div>

      <button type="submit"
        className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-lg hover:bg-[#00522B] text-sm">
        Confirm Production & Deduct Stock
      </button>
    </form>
  );
}
