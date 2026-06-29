"use client";

import { useState } from "react";
import Link from "next/link";

interface OrderSummary {
  id: string;
  shortId: string;
  status: string;
  fulfillmentStatus: string;
  orderChannel: string;
  total: number;
  createdAt: string;
  itemCount: number;
  itemSummary: { title: string; size: string; quantity: number }[];
  hasShipment: boolean;
  trackingNumber: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  paid:      "bg-green-50 text-green-700",
  pending:   "bg-amber-50 text-amber-700",
  failed:    "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const FULFILLMENT_LABELS: Record<string, string> = {
  pending:    "Order Placed",
  processing: "Dispatched",
  completed:  "Delivered",
  cancelled:  "Cancelled",
};

export default function AccountPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [orders,  setOrders]  = useState<OrderSummary[] | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrders(null);
    setLoading(true);

    const res  = await fetch("/api/account/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setOrders(data.orders);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Hero */}
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins">My Orders</h1>
        <p className="text-[#FFF8E1] text-sm mt-1">Enter your email to view all your past orders.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Lookup form */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email used at checkout"
              required
              autoFocus
              className="flex-1 border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#006A38]"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#006A38] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? "Looking up…" : "View Orders"}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
          )}
        </div>

        {/* Results */}
        {orders !== null && (
          orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-10 text-center">
              <p className="text-3xl mb-3">🛒</p>
              <p className="font-bold text-[#212121]">No orders found</p>
              <p className="text-sm text-[#8D6E63] mt-1">No orders are linked to this email address.</p>
              <Link href="/product" className="inline-block mt-4 text-[#006A38] font-bold text-sm hover:underline">
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#8D6E63] font-medium">
                {orders.length} order{orders.length !== 1 ? "s" : ""} found
              </p>
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider">Order</p>
                      <p className="text-xl font-black text-[#006A38] font-mono">#{order.shortId}</p>
                      <p className="text-xs text-[#9E9E9E] mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="text-lg font-black text-[#212121]">₹{order.total.toFixed(2)}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {order.status === "paid" ? "✓ Paid" : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-xs text-[#8D6E63]">
                        {FULFILLMENT_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-4 pt-4 border-t border-[#F5F5F5]">
                    <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-2">Items</p>
                    <div className="space-y-1">
                      {order.itemSummary.map((item, i) => (
                        <p key={i} className="text-sm text-[#424242]">
                          {item.title} <span className="text-[#9E9E9E]">({item.size}) × {item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/track?orderId=${order.id}`}
                      className="text-xs font-bold text-[#006A38] border border-[#006A38] px-3 py-1.5 rounded-lg hover:bg-[#006A38] hover:text-white transition-colors"
                    >
                      Track Order
                    </Link>
                    {order.status !== "cancelled" &&
                      order.fulfillmentStatus === "pending" && (
                      <CancelButton orderId={order.id} email={email} onCancelled={() => {
                        setOrders(prev => prev?.map(o =>
                          o.id === order.id
                            ? { ...o, status: "cancelled", fulfillmentStatus: "cancelled" }
                            : o
                        ) ?? null);
                      }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function CancelButton({ orderId, email, onCancelled }: {
  orderId: string;
  email: string;
  onCancelled: () => void;
}) {
  const [loading,    setLoading]    = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);

  async function handleCancel() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    const res = await fetch("/api/orders/cancel", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ orderId, email }),
    });
    setLoading(false);
    if (res.ok) {
      onCancelled();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to cancel order.");
      setConfirmed(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
        confirmed
          ? "bg-red-600 text-white hover:bg-red-700"
          : "text-red-600 border border-red-300 hover:bg-red-50"
      }`}
    >
      {loading ? "Cancelling…" : confirmed ? "Confirm Cancel?" : "Cancel Order"}
    </button>
  );
}
