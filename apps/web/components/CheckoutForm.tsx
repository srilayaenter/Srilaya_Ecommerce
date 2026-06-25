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
  const total = subtotal + taxTotal + shippingFee;

  const weightDisplay =
    totalWeightGrams >= 1000
      ? `${(totalWeightGrams / 1000).toFixed(2)} kg`
      : `${totalWeightGrams} g`;

  const canSubmit = selectedCourier !== "" && isPending === false;

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    await createOrder(formData);
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      {/* ── Shipping Form ── */}
      <div className="md:col-span-2">
        <form action={handleSubmit} className="space-y-6">
          {/* Hidden shipping values passed to server action */}
          <input type="hidden" name="shippingFee"  value={shippingFee} />
          <input type="hidden" name="courierName"  value={selectedCourier} />

          {/* Address Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 text-slate-900">Shipping Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text" name="name" required
                  placeholder="Ravi Kumar"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email" name="email" required
                    placeholder="you@example.com"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel" name="phone" required
                    placeholder="+91 98765 43210"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Address *
                </label>
                <textarea
                  name="address" required rows={3}
                  placeholder="Street address, flat/house number..."
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    City *
                  </label>
                  <input
                    type="text" name="city" required
                    placeholder="Mysuru"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
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
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    ZIP Code *
                  </label>
                  <input
                    type="text" name="zipCode" required
                    placeholder="570001"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Courier Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-2 text-slate-900">Choose Courier</h2>

            {!state.trim() ? (
              <p className="text-sm text-slate-400 py-4">
                Enter your state above to see available shipping options and rates.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {zone ? getZoneLabel(zone) : ""}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Total parcel weight: <strong>{weightDisplay}</strong>
                  </span>
                </div>

                <div className="grid gap-3">
                  {courierOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedCourier === opt.key
                          ? "border-brand-green bg-emerald-50"
                          : "border-slate-100 hover:border-slate-300 bg-white"
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
                          <p className="font-bold text-slate-800 text-sm">{opt.name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Estimated delivery: {opt.etaDays}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-base">
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

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-brand-green text-white py-3.5 rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Processing..." : "Continue to Payment"}
          </button>
        </form>
      </div>

      {/* ── Order Summary ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
        <h3 className="text-xl font-bold mb-4 border-b border-slate-50 pb-3 text-slate-900">
          Order Summary
        </h3>

        <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs font-medium">
              <div>
                <p className="font-bold text-slate-800">{item.title}</p>
                <p className="text-slate-400 mt-0.5">
                  {item.size} × {item.quantity}
                </p>
              </div>
              <p className="font-bold text-slate-900">
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-medium">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>GST</span>
            <span className="font-bold text-slate-800">₹{taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Shipping</span>
            {selectedOption ? (
              <span className="font-bold text-slate-800">₹{shippingFee.toFixed(2)}</span>
            ) : (
              <span className="text-slate-400 italic">Select courier</span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-4">
          <div className="flex justify-between text-xl font-extrabold">
            <span className="text-slate-900">Total</span>
            <span className="text-brand-green">
              {selectedOption ? `₹${total.toFixed(2)}` : "—"}
            </span>
          </div>
          {selectedOption && (
            <p className="text-[10px] text-slate-400 mt-1 text-right">
              via {selectedOption.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
