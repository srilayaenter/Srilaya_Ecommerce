'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BRAND } from "@/lib/brand";

interface ShipmentData {
  courier: string;
  trackingNumber: string;
  trackingUrl?: string | null;
  status: string;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
}

interface OrderData {
  id: string;
  shortId: string;
  customerName: string;
  email: string;
  phone: string;
  status: string;
  fulfillmentStatus: string;
  orderChannel: string;
  paymentMethod: string;
  subtotal: number;
  taxTotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  items: { title: string; size: string; quantity: number; price: number; gstRate: number }[];
  shipment: ShipmentData | null;
}

const FULFILLMENT_STEPS = ['pending', 'processing', 'completed'];

const STEP_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  pending:    { label: 'Order Placed',   desc: 'Your order has been received.',              icon: '📋' },
  processing: { label: 'Dispatched',     desc: 'Your order is packed and on the way.',       icon: '🚚' },
  completed:  { label: 'Delivered',      desc: 'Your order has been delivered. Enjoy!',      icon: '✅' },
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', card: 'Card (POS)', bank_transfer: 'Bank Transfer', razorpay: 'Online (Razorpay)',
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId,  setOrderId]  = useState(searchParams.get('orderId') ?? '');
  const [contact,  setContact]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [order,    setOrder]    = useState<OrderData | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);

    const res  = await fetch('/api/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId: orderId.trim(), contact: contact.trim() }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.');
    } else {
      setOrder(data);
    }
  }

  const currentStep = order ? FULFILLMENT_STEPS.indexOf(order.fulfillmentStatus) : -1;

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Hero strip */}
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins">Track Your Order</h1>
        <p className="text-[#FFF8E1] text-sm mt-1">Enter your Order ID and the email or phone used at checkout.</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Lookup form */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. #CMQXAHRX"
                required
                className="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#006A38] font-mono"
              />
              <p className="text-xs text-[#9E9E9E] mt-1">Found in your order confirmation email or WhatsApp receipt.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Email or Phone</label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="email@example.com or 9876543210"
                required
                className="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006A38] text-white font-bold py-3 rounded-xl hover:bg-[#00522B] transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? 'Looking up…' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Order result */}
        {order && (
          <div className="space-y-5">

            {/* Header card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider">Order</p>
                  <p className="text-2xl font-black text-[#006A38] font-mono mt-0.5">#{order.shortId}</p>
                  <p className="text-sm text-[#616161] mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  {order.orderChannel === 'in_store' && (
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-[#FF9800]/10 text-[#E65100] px-2 py-0.5 rounded-full">In-Store Purchase</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-black text-[#212121] mt-0.5">₹{order.total.toFixed(2)}</p>
                  <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-1 rounded-full ${order.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {order.status === 'paid' ? '✓ Payment Confirmed' : '⏳ Payment Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress timeline */}
            {order.fulfillmentStatus !== 'cancelled' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
                <h2 className="text-sm font-bold text-[#212121] mb-6">Order Progress</h2>
                <div className="relative">
                  {/* connector line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-[#E0E0E0] -z-0" />
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-[#006A38] transition-all duration-500 -z-0"
                    style={{ width: currentStep === 0 ? '0%' : currentStep === 1 ? '50%' : '100%' }}
                  />
                  <div className="relative flex justify-between">
                    {FULFILLMENT_STEPS.map((step, idx) => {
                      const done    = idx <= currentStep;
                      const active  = idx === currentStep;
                      const info    = STEP_LABELS[step];
                      return (
                        <div key={step} className="flex flex-col items-center text-center w-1/3 px-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                            done
                              ? 'bg-[#006A38] border-[#006A38] shadow-md'
                              : 'bg-white border-[#E0E0E0]'
                          }`}>
                            {done ? <span>{info.icon}</span> : <span className="text-[#9E9E9E] text-sm font-bold">{idx + 1}</span>}
                          </div>
                          <p className={`text-xs font-bold mt-2 ${active ? 'text-[#006A38]' : done ? 'text-[#424242]' : 'text-[#9E9E9E]'}`}>
                            {info.label}
                          </p>
                          {active && (
                            <p className="text-[10px] text-[#8D6E63] mt-0.5 leading-tight">{info.desc}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {order.fulfillmentStatus === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                <p className="text-2xl mb-1">❌</p>
                <p className="font-bold text-red-700">Order Cancelled</p>
                <p className="text-sm text-red-600 mt-1">Please contact us if you have questions.</p>
              </div>
            )}

            {/* Shipment tracking */}
            {order.shipment && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
                <h2 className="text-sm font-bold text-[#212121] mb-4">Shipment Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#9E9E9E] tracking-wider">Courier</p>
                    <p className="font-semibold mt-0.5">{order.shipment.courier}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#9E9E9E] tracking-wider">Tracking No.</p>
                    <p className="font-mono font-semibold mt-0.5">{order.shipment.trackingNumber}</p>
                  </div>
                  {order.shipment.shippedAt && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#9E9E9E] tracking-wider">Shipped On</p>
                      <p className="font-semibold mt-0.5">{new Date(order.shipment.shippedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  )}
                  {order.shipment.estimatedDelivery && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#9E9E9E] tracking-wider">Est. Delivery</p>
                      <p className="font-semibold mt-0.5 text-[#006A38]">{new Date(order.shipment.estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>
                {order.shipment.trackingUrl && (
                  <a
                    href={order.shipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 bg-[#006A38] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#00522B] transition-colors"
                  >
                    🔍 Track on Courier Website
                  </a>
                )}
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <h2 className="text-sm font-bold text-[#212121] mb-4">Items Ordered</h2>
              <div className="divide-y divide-[#F5F5F5]">
                {order.items.map((item, i) => {
                  const lineTotal = item.price * item.quantity * (1 + item.gstRate / 100);
                  return (
                    <div key={i} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-semibold text-[#212121]">{item.title}</p>
                        <p className="text-xs text-[#8D6E63]">{item.size} × {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[#212121]">₹{lineTotal.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[#E0E0E0] mt-2 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-[#616161]"><span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-[#616161]"><span>GST</span><span>₹{order.taxTotal.toFixed(2)}</span></div>
                {order.shippingFee > 0 && (
                  <div className="flex justify-between text-[#616161]"><span>Shipping</span><span>₹{order.shippingFee.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-black text-[#212121] text-base pt-1 border-t border-[#006A38]">
                  <span>Total</span><span className="text-[#006A38]">₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            {order.orderChannel !== 'in_store' && order.address && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
                <h2 className="text-sm font-bold text-[#212121] mb-2">Delivery Address</h2>
                <p className="text-sm text-[#616161]">{order.address}</p>
                <p className="text-sm text-[#616161]">{[order.city, order.state].filter(Boolean).join(', ')}{order.zipCode ? ` – ${order.zipCode}` : ''}</p>
              </div>
            )}

            {/* Help */}
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-5 text-center text-sm text-[#8D6E63]">
              <p className="font-bold text-[#212121] mb-1">Need help with your order?</p>
              <p>Call us at <a href={`tel:${BRAND.phone}`} className="text-[#006A38] font-bold">{BRAND.phone}</a> or email <a href={`mailto:${BRAND.email}`} className="text-[#006A38] font-bold">{BRAND.email}</a></p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F6F0]" />}>
      <TrackOrderContent />
    </Suspense>
  );
}
