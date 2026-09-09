import { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Shipping Policy | ${BRAND.name}`,
  description: "Delivery timelines, charges, and coverage for SriLaYa Naturals orders.",
};

const LAST_UPDATED = "30 June 2026";

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white">Shipping Policy</h1>
        <p className="text-green-200 text-sm mt-1">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 space-y-8 text-[#424242] text-sm leading-relaxed">

          <Section title="1. Where We Ship">
            <p>
              We currently ship across <strong>India</strong>. Deliveries are available to most
              serviceable pin codes via our logistics partners (DTDC, Bluedart, Delhivery, Ekart,
              and others). We do not ship internationally at this time.
            </p>
            <p className="mt-2">
              If your pin code is not serviceable, you will be notified during checkout before
              completing payment.
            </p>
          </Section>

          <Section title="2. Processing Time">
            <ul className="list-disc pl-5 space-y-2">
              <li>Orders are processed within <strong>1–2 business days</strong> of confirmation.</li>
              <li>Business days are Monday to Saturday, 9 AM – 6 PM IST (excluding public holidays).</li>
              <li>Orders placed on Sundays or public holidays are processed the next business day.</li>
              <li>Cash on Delivery (COD) orders may require additional 1 business day for verification.</li>
            </ul>
          </Section>

          <Section title="3. Estimated Delivery Timeline">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="bg-[#F1F8F4]">
                    <th className="text-left p-3 border border-[#E0E0E0] font-semibold">Destination</th>
                    <th className="text-left p-3 border border-[#E0E0E0] font-semibold">Estimated Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-[#E0E0E0]">Bengaluru (local)</td>
                    <td className="p-3 border border-[#E0E0E0]">1–2 business days</td>
                  </tr>
                  <tr className="bg-[#FAFAFA]">
                    <td className="p-3 border border-[#E0E0E0]">Karnataka (rest of state)</td>
                    <td className="p-3 border border-[#E0E0E0]">2–4 business days</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-[#E0E0E0]">South India (AP, TN, KL, TS)</td>
                    <td className="p-3 border border-[#E0E0E0]">3–5 business days</td>
                  </tr>
                  <tr className="bg-[#FAFAFA]">
                    <td className="p-3 border border-[#E0E0E0]">Rest of India</td>
                    <td className="p-3 border border-[#E0E0E0]">5–8 business days</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-[#E0E0E0]">Remote / hilly areas</td>
                    <td className="p-3 border border-[#E0E0E0]">7–12 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[#9E9E9E]">
              These are estimates. Actual delivery may vary due to courier delays, weather, or
              regional disruptions.
            </p>
          </Section>

          <Section title="4. Shipping Charges">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Free shipping</strong> on orders above ₹499.</li>
              <li>Orders below ₹499 attract a flat shipping fee displayed at checkout based on weight and destination.</li>
              <li>COD orders may attract a small COD handling fee, shown at checkout.</li>
            </ul>
          </Section>

          <Section title="5. Order Tracking">
            <p>
              Once your order is dispatched, you will receive an email and/or SMS with the tracking
              number and courier name. You can track your order at{" "}
              <a href="/track" className="text-[#006A38] font-medium hover:underline">srilaya.com/track</a>{" "}
              or directly on the courier's website.
            </p>
            <p className="mt-2">
              Tracking details are also available in your account under{" "}
              <a href="/account" className="text-[#006A38] font-medium hover:underline">My Orders</a>.
            </p>
          </Section>

          <Section title="6. Packaging">
            <p>
              All products are packed in food-grade, airtight packaging to preserve freshness.
              We use minimal plastic; most secondary packaging is recyclable cardboard or paper.
              Fragile or bulk orders may use additional protective material.
            </p>
          </Section>

          <Section title="7. Address Accuracy">
            <p>
              Please ensure your delivery address is complete and correct at checkout. We are not
              responsible for delivery failures or delays caused by incorrect or incomplete addresses.
              Address changes after dispatch are not guaranteed and may incur additional charges.
            </p>
          </Section>

          <Section title="8. Undelivered Packages">
            <p>
              If a package is returned to us due to an incorrect address, non-availability, or
              refusal to accept, we will contact you. Re-shipment will be arranged at an additional
              shipping charge. If re-shipment is not feasible, a refund will be issued minus the
              original and return shipping costs.
            </p>
          </Section>

          <Section title="9. Contact Us">
            <p>
              For shipping-related queries, email us at{" "}
              <a href={`mailto:${BRAND.email}`} className="text-[#006A38] font-medium hover:underline">{BRAND.email}</a>{" "}
              or call <strong>{BRAND.phone}</strong> (Mon–Sat, 9 AM – 6 PM IST).
            </p>
          </Section>

          <div className="border-t border-[#E0E0E0] pt-6 text-xs text-[#9E9E9E]">
            <p><strong>{BRAND.name}</strong> | {BRAND.address}</p>
            <p>Phone: {BRAND.phone} | Email: {BRAND.email}</p>
            {BRAND.gstin && <p>GSTIN: {BRAND.gstin}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-[#212121] mb-3">{title}</h2>
      {children}
    </div>
  );
}
