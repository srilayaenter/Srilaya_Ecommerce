"use client";

import { useState, useMemo } from "react";
import { createOrder } from "@/app/actions/orders";
import {
  getAllCourierOptions,
  getZone,
  getZoneLabel,
  type CourierKey,
  type CourierOption,
} from "@/lib/shipping";
import { MIN_REDEEM_POINTS, RUPEES_PER_POINT, maxRedeemablePoints } from "@/lib/loyalty";

interface CartSummaryItem {
  id: string;
  title: string;
  size: string;
  quantity: number;
  price: number;
  weightGrams: number;
}

interface CheckoutFormProps {
  cartItems: CartSummaryItem[];
  subtotal: number;
  taxTotal: number;
}

export default function CheckoutForm({ cartItems, subtotal, taxTotal }: CheckoutFormProps) {
  const [state, setState] = useState("");
  const [selectedCourier, setSelectedCourier] = useState<CourierKey | "">("");
  const [isPending, setIsPending] = useState(false);

  async function handleEmailBlur(e: React.FocusEvent<HTMLInputElement>) {
    const email = e.target.value.trim();
    if (!email || !email.includes("@")) return;
    fetch("/api/cart/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    // Check loyalty balance
    const res = await fetch(`/api/loyalty/balance?email=${encodeURIComponent(email)}`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setLoyaltyBalance(data.balance ?? 0);
    }
  }

  const totalWeightGrams = cartItems.reduce(
    (sum, item) => sum + item.weightGrams * item.quantity,
    0
  );

  const zone = useMemo(() => (state.trim() ? getZone(state) : null), [state]);

  const courierOptions: CourierOption[] = useMemo(
    () => (zone ? getAllCourierOptions(zone, totalWeightGrams) : []),
    [zone, totalWeightGrams]
  );

  const selectedOption = courierOptions.find((c) => c.key === selectedCourier) ?? null;
  const shippingFee = selectedOption?.cost ?? 0;

  const weightDisplay =
    totalWeightGrams >= 1000
      ? `${(totalWeightGrams / 1000).toFixed(2)} kg`
      : `${totalWeightGrams} g`;

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [referralCode,   setReferralCode]   = useState("");
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [applyPoints, setApplyPoints] = useState(false);
  const canSubmit = selectedCourier !== "" && isPending === false;

  const redeemablePoints = loyaltyBalance >= MIN_REDEEM_POINTS
    ? maxRedeemablePoints(subtotal + taxTotal + shippingFee, loyaltyBalance)
    : 0;
  const loyaltyDiscount = applyPoints ? parseFloat((redeemablePoints * RUPEES_PER_POINT).toFixed(2)) : 0;
  const total = subtotal + taxTotal + shippingFee - loyaltyDiscount;

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    await createOrder(formData);
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      {/* ── Shipping Form ── */}
      <div className="md:col-span-2">
        <form action={handleSubmit} className="space-y-6">
          {/* Hidden values passed to server action */}
          <input type="hidden" name="shippingFee"    value={shippingFee} />
          <input type="hidden" name="courierName"    value={selectedCourier} />
          <input type="hidden" name="paymentMethod"  value={paymentMethod} />
          <input type="hidden" name="redeemedPoints" value={applyPoints ? redeemablePoints : 0} />
          <input type="hidden" name="referralCode"   value={referralCode.trim().toUpperCase()} />

          {/* Address Card */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-[#212121]">Shipping Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase tracking-wide mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text" name="name" required
                  placeholder="Ravi Kumar"
                  className="w-full text-sm border border-[#E0E0E0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006A38] bg-white text-[#424242]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase tracking-wide mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email" name="email" required
                    placeholder="you@example.com"
                    onBlur={handleEmailBlur}
                    className="w-full text-sm border border-[#E0E0E0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006A38] bg-white text-[#424242]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase tracking-wide mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel" name="phone" required
                    placeholder="+91 98765 43210"
                    className="w-full text-sm border border-[#E0E0E0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006A38] bg-white text-[#424242]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#757575] uppercase tracking-wide mb-1.5">
                  Address *
                </label>
                <textarea
                  name="address" required rows={3}
                  placeholder="Street address, flat/house number..."
                  className="w-full text-sm border border-[#E0E0E0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006A38] bg-white text-[#424242] resize-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase tracking-wide mb-1.5">
                    City *
                  </label>
                  <input
                    type="text" name="city" required
                    placeholder="Mysuru"
                    className="w-full text-sm border border-[#E0E0E0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006A38] bg-white text-[#424242]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase tracking-wide mb-1.5">
                    State *
                  </label>
                  <input
                    type="text" name="state" required
                    placeholder="Karnataka"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setSelectedCourier("");
                    }}
                    className="w-full text-sm border border-[#E0E0E0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006A38] bg-white text-[#424242]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase tracking-wide mb-1.5">
                    ZIP Code *
                  </label>
                  <input
                    type="text" name="zipCode" required
                    placeholder="570001"
                    className="w-full text-sm border border-[#E0E0E0] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#006A38] bg-white text-[#424242]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Courier Selector Card */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2 text-[#212121]">Choose Courier</h2>

            {!state.trim() ? (
              <p className="text-sm text-[#9E9E9E] py-4">
                Enter your state above to see available shipping options and rates.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {zone ? getZoneLabel(zone) : ""}
                  </span>
                  <span className="text-xs text-[#9E9E9E] font-medium">
                    Total parcel weight: <strong>{weightDisplay}</strong>
                  </span>
                </div>

                <div className="grid gap-3">
                  {courierOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedCourier === opt.key
                          ? "border-[#006A38] bg-emerald-50"
                          : "border-[#E0E0E0] hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="courierDisplay"
                          value={opt.key}
                          checked={selectedCourier === opt.key}
                          onChange={() => setSelectedCourier(opt.key)}
                          className="accent-emerald-700 w-4 h-4"
                        />
                        <div>
                          <p className="font-bold text-[#212121] text-sm">{opt.name}</p>
                          <p className="text-xs text-[#9E9E9E] font-medium mt-0.5">
                            Estimated delivery: {opt.etaDays}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-[#212121] text-base">
                        ₹{opt.cost.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>

                {selectedCourier === "" && (
                  <p className="text-xs text-amber-600 font-semibold mt-3">
                    Please select a courier to continue.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Payment method selector */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-[#212121]">Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "online", label: "Pay Online", desc: "UPI / Card / Razorpay", icon: "💳" },
                { value: "cod",    label: "Cash on Delivery", desc: "Pay when order arrives", icon: "🛵" },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className={`flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === opt.value
                      ? "border-[#006A38] bg-emerald-50"
                      : "border-[#E0E0E0] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentDisplay"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                      className="accent-emerald-700 w-4 h-4"
                    />
                    <span className="text-lg">{opt.icon}</span>
                    <span className="font-bold text-sm text-[#212121]">{opt.label}</span>
                  </div>
                  <p className="text-xs text-[#9E9E9E] pl-6">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Referral code */}
          <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-5">
            <p className="text-sm font-bold text-[#424242] mb-2">Have a referral code?</p>
            <input
              type="text"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. SL-ABC123"
              maxLength={12}
              className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38] bg-white text-[#424242] font-mono tracking-widest"
            />
            <p className="text-xs text-[#9E9E9E] mt-1">Both you and your friend get 50 loyalty points on your first order.</p>
          </div>

          {/* Loyalty points widget */}
          {loyaltyBalance >= MIN_REDEEM_POINTS && (
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#E65100] text-sm">🎁 You have {loyaltyBalance} loyalty points</p>
                  <p className="text-xs text-[#757575] mt-0.5">
                    Apply {redeemablePoints} points for ₹{(redeemablePoints * RUPEES_PER_POINT).toFixed(2)} off this order
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyPoints}
                    onChange={e => setApplyPoints(e.target.checked)}
                    className="w-4 h-4 accent-[#006A38]"
                  />
                  <span className="text-sm font-bold text-[#006A38]">Apply</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#006A38] text-white py-3.5 rounded-xl font-bold hover:bg-[#00522B] transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? "Processing..."
              : paymentMethod === "cod"
              ? "Place Order (Pay on Delivery)"
              : "Continue to Payment"}
          </button>
        </form>
      </div>

      {/* ── Order Summary ── */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-6 sticky top-24">
        <h3 className="text-xl font-bold mb-4 border-b border-[#F0F0F0] pb-3 text-[#212121]">
          Order Summary
        </h3>

        <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs font-medium">
              <div>
                <p className="font-bold text-[#212121]">{item.title}</p>
                <p className="text-[#9E9E9E] mt-0.5">
                  {item.size} × {item.quantity}
                </p>
              </div>
              <p className="font-bold text-[#212121]">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-[#E0E0E0] pt-4 space-y-2 text-xs font-medium">
          <div className="flex justify-between text-[#757575]">
            <span>Subtotal</span>
            <span className="font-bold text-[#212121]">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#757575]">
            <span>GST</span>
            <span className="font-bold text-[#212121]">₹{taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#757575]">
            <span>Shipping</span>
            {selectedOption ? (
              <span className="font-bold text-[#212121]">₹{shippingFee.toFixed(2)}</span>
            ) : (
              <span className="text-[#9E9E9E] italic">Select courier</span>
            )}
          </div>
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Loyalty discount</span>
              <span className="font-bold">−₹{loyaltyDiscount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-[#E0E0E0] pt-4 mt-4">
          <div className="flex justify-between text-xl font-extrabold">
            <span className="text-[#212121]">Total</span>
            <span className="text-[#006A38]">
              {selectedOption ? `₹${total.toFixed(2)}` : "—"}
            </span>
          </div>
          {selectedOption && (
            <p className="text-[10px] text-[#9E9E9E] mt-1 text-right">
              via {selectedOption.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
