"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface OrderSummary {
  id: string; shortId: string; status: string; fulfillmentStatus: string;
  orderChannel: string; paymentMethod: string | null; total: number;
  createdAt: string; itemCount: number;
  itemSummary: { title: string; size: string; quantity: number }[];
  hasShipment: boolean; trackingNumber: string | null;
}

interface UserProfile {
  id: string; email: string | null; phone: string | null;
  role: string; createdAt: string;
}

interface Props {
  mode: "guest" | "authenticated";
  user?: UserProfile;
  initialOrders?: OrderSummary[];
}

const STATUS_STYLES: Record<string, string> = {
  paid:         "bg-green-50 text-green-700",
  pending:      "bg-amber-50 text-amber-700",
  cod_pending:  "bg-amber-50 text-amber-700",
  failed:       "bg-red-50 text-red-700",
  cancelled:    "bg-gray-100 text-gray-500",
};

const FULFILLMENT_LABELS: Record<string, string> = {
  pending:    "Order Placed",
  processing: "Dispatched",
  completed:  "Delivered",
  cancelled:  "Cancelled",
};

export default function AccountClient({ mode, user, initialOrders }: Props) {
  // Guest state
  const [guestEmail, setGuestEmail] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError,   setGuestError]   = useState("");
  const [guestOrders,  setGuestOrders]  = useState<OrderSummary[] | null>(null);

  // Authenticated state
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders ?? []);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew,     setPwNew]     = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg,     setPwMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [showPw,    setShowPw]    = useState(false);

  async function handleGuestLookup(e: React.FormEvent) {
    e.preventDefault();
    setGuestError(""); setGuestOrders(null); setGuestLoading(true);
    const res  = await fetch("/api/account/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: guestEmail.trim() }),
    });
    const data = await res.json();
    setGuestLoading(false);
    res.ok ? setGuestOrders(data.orders) : setGuestError(data.error ?? "Something went wrong.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pwNew !== pwConfirm) { setPwMsg({ ok: false, text: "New passwords do not match." }); return; }
    if (pwNew.length < 8)    { setPwMsg({ ok: false, text: "Password must be at least 8 characters." }); return; }
    setPwLoading(true);
    const res  = await fetch("/api/account/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
    });
    const data = await res.json();
    setPwLoading(false);
    setPwMsg({ ok: res.ok, text: data.message ?? data.error ?? "Done." });
    if (res.ok) { setPwCurrent(""); setPwNew(""); setPwConfirm(""); }
  }

  // ── AUTHENTICATED VIEW ──────────────────────────────────────────────
  if (mode === "authenticated" && user) {
    const identifier = user.email ?? (user.phone ? `+91 ${user.phone}` : "—");
    const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    return (
      <div className="min-h-screen bg-[#F9F6F0]">
        <div className="bg-[#006A38] py-10 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mx-auto mb-3">
            {user.email ? user.email[0].toUpperCase() : "📱"}
          </div>
          <h1 className="text-2xl font-black text-white">{identifier}</h1>
          <p className="text-green-200 text-sm mt-1">Member since {memberSince}</p>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 space-y-3">
            <h2 className="font-bold text-[#212121] text-lg">Account Details</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-[#212121] font-medium">{user.email ?? <span className="text-[#9E9E9E] italic">Not set</span>}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#9E9E9E] uppercase tracking-wider mb-0.5">Phone</p>
                <p className="text-[#212121] font-medium">{user.phone ? `+91 ${user.phone}` : <span className="text-[#9E9E9E] italic">Not set</span>}</p>
              </div>
            </div>
            <div className="pt-3 flex gap-3">
              <button
                onClick={() => setShowPw(v => !v)}
                className="text-sm font-bold text-[#006A38] border border-[#006A38] px-4 py-2 rounded-lg hover:bg-[#006A38] hover:text-white transition-colors"
              >
                {showPw ? "Cancel" : "Change Password"}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-bold text-[#9E9E9E] border border-[#E0E0E0] px-4 py-2 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>

            {showPw && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3 border-t border-[#F0F0F0] pt-4">
                {[
                  { label: "Current Password", value: pwCurrent, set: setPwCurrent },
                  { label: "New Password",      value: pwNew,     set: setPwNew },
                  { label: "Confirm New",       value: pwConfirm, set: setPwConfirm },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-bold text-[#424242] mb-1">{f.label}</label>
                    <input
                      type="password" value={f.value} onChange={e => f.set(e.target.value)} required
                      className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38]"
                    />
                  </div>
                ))}
                {pwMsg && (
                  <p className={`text-sm font-medium ${pwMsg.ok ? "text-green-700" : "text-red-600"}`}>{pwMsg.text}</p>
                )}
                <button
                  type="submit" disabled={pwLoading}
                  className="bg-[#006A38] text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60"
                >
                  {pwLoading ? "Saving…" : "Update Password"}
                </button>
              </form>
            )}
          </div>

          {/* Orders */}
          <div>
            <h2 className="font-bold text-[#212121] text-lg mb-4">
              Order History
              <span className="ml-2 text-sm font-normal text-[#9E9E9E]">({orders.length} orders)</span>
            </h2>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-10 text-center">
                <p className="text-3xl mb-3">🛒</p>
                <p className="font-bold text-[#212121]">No orders yet</p>
                <Link href="/product" className="inline-block mt-4 text-[#006A38] font-bold text-sm hover:underline">
                  Start shopping →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <OrderCard key={order.id} order={order} contact={user.email ?? user.phone ?? ""} onCancel={(id) =>
                    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled", fulfillmentStatus: "cancelled" } : o))
                  } />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── GUEST VIEW ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins">My Orders</h1>
        <p className="text-[#FFF8E1] text-sm mt-1">Sign in or look up by email to view your orders.</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Primary CTA — sign in */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6 text-center">
          <div className="text-4xl mb-3">👤</div>
          <h2 className="font-bold text-[#212121] text-lg mb-1">Sign in to your account</h2>
          <p className="text-sm text-[#757575] mb-5">See all your orders, track deliveries, manage your profile, and view your loyalty points — all in one place.</p>
          <a
            href="/login"
            className="inline-block w-full sm:w-auto bg-[#006A38] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#00522B] transition-colors"
          >
            Sign In
          </a>
          <p className="text-xs text-[#9E9E9E] mt-3">
            New here?{" "}
            <a href="/register" className="text-[#006A38] font-bold hover:underline">Create an account</a>
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-[#E0E0E0]" />
          <span className="text-xs text-[#9E9E9E] font-medium uppercase tracking-wider">or look up as guest</span>
          <div className="flex-1 border-t border-[#E0E0E0]" />
        </div>

        {/* Secondary — guest email lookup */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
          <h2 className="font-semibold text-[#424242] mb-3 text-sm">Look up orders by email</h2>
          <form onSubmit={handleGuestLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
              placeholder="Email used at checkout" required
              className="flex-1 border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#006A38]"
            />
            <button
              type="submit" disabled={guestLoading}
              className="border border-[#006A38] text-[#006A38] font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#e8f5ee] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {guestLoading ? "Looking up…" : "View Orders"}
            </button>
          </form>
          {guestError && <p className="mt-3 text-sm text-red-600 font-medium">{guestError}</p>}
        </div>

        {guestOrders !== null && (
          guestOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] p-10 text-center">
              <p className="text-3xl mb-3">🛒</p>
              <p className="font-bold text-[#212121]">No orders found</p>
              <Link href="/product" className="inline-block mt-4 text-[#006A38] font-bold text-sm hover:underline">Start shopping →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#424242] font-medium">{guestOrders.length} order{guestOrders.length !== 1 ? "s" : ""} found</p>
              {guestOrders.map(order => (
                <OrderCard key={order.id} order={order} contact={guestEmail} onCancel={(id) =>
                  setGuestOrders(prev => prev?.map(o => o.id === id ? { ...o, status: "cancelled", fulfillmentStatus: "cancelled" } : o) ?? null)
                } />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, contact, onCancel }: { order: OrderSummary; contact: string; onCancel: (id: string) => void }) {
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  async function handleCancel() {
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setCancelLoading(true);
    const res = await fetch("/api/orders/cancel", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, email: contact }),
    });
    setCancelLoading(false);
    if (res.ok) { onCancel(order.id); }
    else { const d = await res.json(); alert(d.error ?? "Failed to cancel order."); setCancelConfirm(false); }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-5">
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
            {order.status === "paid" ? "✓ Paid" : order.status.replace("_", " ")}
          </span>
          <span className="text-xs text-[#424242]">{FULFILLMENT_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}</span>
        </div>
      </div>

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

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/track?orderId=${order.id}&contact=${encodeURIComponent(contact)}`}
          className="text-xs font-bold text-[#006A38] border border-[#006A38] px-3 py-1.5 rounded-lg hover:bg-[#006A38] hover:text-white transition-colors"
        >
          Track Order
        </Link>
        <Link
          href={`/orders/${order.id}`}
          className="text-xs font-bold text-[#424242] border border-[#E0E0E0] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
        >
          View Details
        </Link>
        {order.status !== "cancelled" && order.fulfillmentStatus === "pending" && (
          <button
            onClick={handleCancel} disabled={cancelLoading}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
              cancelConfirm ? "bg-red-600 text-white hover:bg-red-700" : "text-red-600 border border-red-300 hover:bg-red-50"
            }`}
          >
            {cancelLoading ? "Cancelling…" : cancelConfirm ? "Confirm Cancel?" : "Cancel Order"}
          </button>
        )}
      </div>
    </div>
  );
}
