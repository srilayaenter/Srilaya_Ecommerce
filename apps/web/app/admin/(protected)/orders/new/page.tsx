'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOfflineOrder } from "@/app/actions/offlineOrder";

interface Variant { id: string; size: string; price: number; stock: number; sku: string; }
interface Product { id: string; title: string; variants: Variant[]; }
interface LineItem { variantId: string; productTitle: string; size: string; price: number; qty: number; }

export default function NewOfflineOrderPage() {
  const router = useRouter();

  // catalog
  const [products, setProducts]       = useState<Product[]>([]);
  const [loaded, setLoaded]           = useState(false);
  const [loading, setLoading]         = useState(false);

  // item picker
  const [items, setItems]             = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [qty, setQty]                 = useState(1);

  // customer fields — controlled so we can read them without a form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes]             = useState('');

  // submission
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  async function loadProducts() {
    setLoading(true);
    const res  = await fetch('/api/admin/products-for-order');
    const data = await res.json();
    setProducts(data);
    setLoaded(true);
    setLoading(false);
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
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  }

  async function handleCreate() {
    if (!customerName.trim()) { setError('Customer name is required.'); return; }
    if (items.length === 0)   { setError('Add at least one product.'); return; }

    setError('');
    setSubmitting(true);

    const fd = new FormData();
    fd.set('customerName',  customerName.trim());
    fd.set('phone',         phone.trim());
    fd.set('email',         email.trim());
    fd.set('paymentMethod', paymentMethod);
    fd.set('notes',         notes.trim());
    items.forEach((item, idx) => {
      fd.set(`variantId_${idx}`, item.variantId);
      fd.set(`qty_${idx}`,       String(item.qty));
    });

    try {
      await createOfflineOrder(fd);
    } catch (err: any) {
      // redirect() inside server actions throws NEXT_REDIRECT — that means success
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') return;
      setError(err?.message ?? 'Failed to create order. Please try again.');
      setSubmitting(false);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  if (!loaded) {
    return (
      <div className="space-y-6 font-sans pb-12">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="text-sm text-[#006A38] font-bold hover:underline">← Back</button>
          <h1 className="text-2xl font-bold text-[#212121]">New In-Store Order</h1>
        </div>
        <button
          type="button"
          onClick={loadProducts}
          disabled={loading}
          className="bg-[#006A38] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#00522B] transition-colors disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Load Product Catalog'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12 max-w-3xl">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="text-sm text-[#006A38] font-bold hover:underline">← Back to Orders</button>
        <h1 className="text-2xl font-bold text-[#212121]">New In-Store Order</h1>
        <span className="text-xs bg-[#FF9800]/10 text-[#E65100] font-bold px-2 py-1 rounded-full">In-Store / Offline</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
      )}

      {/* ── Product picker ── */}
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
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
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
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
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

        {/* Cart table */}
        {items.length > 0 && (
          <div className="mt-2 border rounded-lg overflow-hidden">
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
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold px-1"
                      >
                        ✕
                      </button>
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

      {/* ── Customer & payment ── plain div, no <form> ── */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-[#212121]">Customer &amp; Payment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Walk-in customer"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Optional"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Optional"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#616161] mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
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
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. bulk order, reference number…"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0]">
            <div className="text-sm text-[#616161]">
              <span className="font-bold text-[#212121]">{items.length} item(s)</span> · Subtotal ₹{subtotal.toFixed(2)} + GST
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="bg-[#006A38] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#00522B] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
