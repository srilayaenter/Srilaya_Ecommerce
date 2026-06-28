'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOfflineOrder } from "@/app/actions/offlineOrder";

interface Variant {
  id: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
}

interface Product {
  id: string;
  title: string;
  variants: Variant[];
}

interface LineItem {
  variantId: string;
  productTitle: string;
  size: string;
  price: number;
  qty: number;
}

export default function NewOfflineOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    const res = await fetch('/api/admin/products-for-order');
    const data = await res.json();
    setProducts(data);
    setLoaded(true);
    setLoading(false);
  }

  if (!loaded) {
    return (
      <div className="space-y-6 font-sans pb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sm text-[#006A38] font-bold hover:underline">← Back</button>
          <h1 className="text-2xl font-bold text-[#212121]">New In-Store Order</h1>
        </div>
        <button
          onClick={loadProducts}
          disabled={loading}
          className="bg-[#006A38] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#00522B] transition-colors disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Load Product Catalog'}
        </button>
      </div>
    );
  }

  const currentProduct = products.find(p => p.id === selectedProduct);
  const currentVariant = currentProduct?.variants.find(v => v.id === selectedVariant);

  function addItem() {
    if (!currentVariant || !currentProduct) return;
    const existing = items.findIndex(i => i.variantId === selectedVariant);
    if (existing >= 0) {
      const updated = [...items];
      updated[existing] = { ...updated[existing], qty: updated[existing].qty + qty };
      setItems(updated);
    } else {
      setItems([...items, {
        variantId:    selectedVariant,
        productTitle: currentProduct.title,
        size:         currentVariant.size,
        price:        currentVariant.price,
        qty,
      }]);
    }
    setSelectedVariant('');
    setQty(1);
  }

  function removeItem(variantId: string) {
    setItems(items.filter(i => i.variantId !== variantId));
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    items.forEach((item, idx) => {
      fd.set(`variantId_${idx}`, item.variantId);
      fd.set(`qty_${idx}`,       String(item.qty));
    });
    try {
      await createOfflineOrder(fd);
    } catch (err: any) {
      // NEXT_REDIRECT is thrown by redirect() — it means success, the router will navigate
      if (err?.message === 'NEXT_REDIRECT' || err?.digest?.startsWith('NEXT_REDIRECT')) {
        return;
      }
      setError(err?.message ?? 'Failed to create order. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 font-sans pb-12 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-sm text-[#006A38] font-bold hover:underline">← Back to Orders</button>
        <h1 className="text-2xl font-bold text-[#212121]">New In-Store Order</h1>
        <span className="text-xs bg-[#FF9800]/10 text-[#E65100] font-bold px-2 py-1 rounded-full">In-Store / Offline</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
      )}

      {/* Add items */}
      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-[#212121]">Add Products</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-[#616161] mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={e => { setSelectedProduct(e.target.value); setSelectedVariant(''); }}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#006A38]"
            >
              <option value="">Select product…</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-[#616161] mb-1">Variant</label>
            <select
              value={selectedVariant}
              onChange={e => setSelectedVariant(e.target.value)}
              disabled={!currentProduct}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#006A38] disabled:opacity-50"
            >
              <option value="">Select size…</option>
              {currentProduct?.variants.map(v => (
                <option key={v.id} value={v.id} disabled={v.stock === 0}>
                  {v.size} — ₹{v.price} ({v.stock} left)
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="block text-xs font-medium text-[#616161] mb-1">Qty</label>
            <input
              type="number"
              min={1}
              max={currentVariant?.stock ?? 999}
              value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
            />
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!selectedVariant}
            className="bg-[#006A38] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00522B] transition-colors disabled:opacity-40"
          >
            + Add
          </button>
        </div>

        {items.length > 0 && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5] text-[11px] uppercase font-bold text-[#9E9E9E]">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Size</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {items.map(item => (
                  <tr key={item.variantId}>
                    <td className="px-4 py-2 font-medium">{item.productTitle}</td>
                    <td className="px-4 py-2 text-[#8D6E63]">{item.size}</td>
                    <td className="px-4 py-2 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.qty}</td>
                    <td className="px-4 py-2 text-right font-bold">₹{(item.price * item.qty).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeItem(item.variantId)} className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#F5F5F5]">
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-xs font-bold text-[#9E9E9E] uppercase">Subtotal (excl. GST)</td>
                  <td className="px-4 py-2 text-right font-bold text-[#006A38]">₹{subtotal.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Customer & payment details */}
      {items.length > 0 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-[#212121]">Customer &amp; Payment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Customer Name *</label>
              <input
                name="customerName"
                required
                placeholder="Walk-in customer"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="Optional"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Optional"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Payment Method *</label>
              <select
                name="paymentMethod"
                required
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#006A38]"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card (POS)</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#616161] mb-1">Notes (optional)</label>
              <input
                name="notes"
                placeholder="e.g. bulk order, reference number…"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-[#616161]">
              <span className="font-bold text-[#212121]">{items.length} item(s)</span> · Subtotal ₹{subtotal.toFixed(2)} + GST
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#006A38] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#00522B] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
