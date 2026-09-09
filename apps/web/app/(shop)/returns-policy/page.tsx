import { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Returns & Refund Policy | ${BRAND.name}`,
  description: "How to return products and get refunds from SriLaYa Naturals.",
};

const LAST_UPDATED = "30 June 2026";

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white">Returns &amp; Refund Policy</h1>
        <p className="text-green-200 text-sm mt-1">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 space-y-8 text-[#424242] text-sm leading-relaxed">

          <div className="bg-[#F1F8F4] rounded-xl p-4 border border-[#C8E6C9]">
            <p className="font-semibold text-[#2E7D32]">
              We want you to be completely satisfied with every order. If something is wrong, we&apos;ll
              make it right — please reach out within 7 days of delivery.
            </p>
          </div>

          <Section title="1. Return Eligibility">
            <p className="mb-3">Returns are accepted within <strong>7 days of delivery</strong> in the following situations:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The product arrived <strong>damaged</strong> (broken seal, crushed packaging, spilled contents).</li>
              <li>The product is <strong>defective</strong> (foreign matter, off smell, visibly spoilt).</li>
              <li>You received the <strong>wrong item</strong> (different product or size from what you ordered).</li>
              <li>The product is <strong>significantly past its expiry date</strong> at the time of delivery.</li>
            </ul>
          </Section>

          <Section title="2. Non-Returnable Items">
            <ul className="list-disc pl-5 space-y-2">
              <li>Products returned more than 7 days after delivery.</li>
              <li>Products that have been <strong>opened and partially consumed</strong> (unless defective).</li>
              <li>Products damaged due to improper storage by the customer after delivery.</li>
              <li>Items marked as <strong>"Final Sale"</strong> or purchased during clearance.</li>
            </ul>
          </Section>

          <Section title="3. How to Raise a Return Request">
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <strong>Email us</strong> at{" "}
                <a href={`mailto:${BRAND.email}`} className="text-[#006A38] font-medium hover:underline">{BRAND.email}</a>{" "}
                or call <strong>{BRAND.phone}</strong> within 7 days of delivery.
              </li>
              <li>
                Include your <strong>order number</strong>, a brief description of the issue, and
                <strong> clear photographs</strong> of the damaged or incorrect product.
              </li>
              <li>
                Our team will respond within <strong>2 business days</strong> to approve the return
                and provide pickup instructions or a prepaid return label where applicable.
              </li>
              <li>
                Once we receive and inspect the returned product, your refund or replacement will
                be processed within <strong>5–7 business days</strong>.
              </li>
            </ol>
          </Section>

          <Section title="4. Refund Methods">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="bg-[#F1F8F4]">
                    <th className="text-left p-3 border border-[#E0E0E0] font-semibold">Original Payment</th>
                    <th className="text-left p-3 border border-[#E0E0E0] font-semibold">Refund Method</th>
                    <th className="text-left p-3 border border-[#E0E0E0] font-semibold">Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-[#E0E0E0]">UPI / Net Banking</td>
                    <td className="p-3 border border-[#E0E0E0]">Original payment method</td>
                    <td className="p-3 border border-[#E0E0E0]">3–5 business days</td>
                  </tr>
                  <tr className="bg-[#FAFAFA]">
                    <td className="p-3 border border-[#E0E0E0]">Credit / Debit Card</td>
                    <td className="p-3 border border-[#E0E0E0]">Original card</td>
                    <td className="p-3 border border-[#E0E0E0]">5–7 business days</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-[#E0E0E0]">Cash on Delivery</td>
                    <td className="p-3 border border-[#E0E0E0]">Bank transfer (NEFT/IMPS)</td>
                    <td className="p-3 border border-[#E0E0E0]">5–7 business days</td>
                  </tr>
                  <tr className="bg-[#FAFAFA]">
                    <td className="p-3 border border-[#E0E0E0]">Loyalty points used</td>
                    <td className="p-3 border border-[#E0E0E0]">Points re-credited to account</td>
                    <td className="p-3 border border-[#E0E0E0]">2–3 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[#9E9E9E]">
              Refunds are processed once the returned item is received and verified. Shipping charges
              are non-refundable unless the return is due to our error.
            </p>
          </Section>

          <Section title="5. Replacements">
            <p>
              If you prefer a replacement over a refund, we will dispatch the correct/undamaged product
              at no extra charge, subject to stock availability. Replacement dispatch happens within
              2 business days of return receipt.
            </p>
          </Section>

          <Section title="6. Order Cancellations">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Orders can be cancelled <strong>within 2 hours of placing</strong> by contacting us
                at {BRAND.email} or {BRAND.phone}. After 2 hours, the order may already be packed
                and cannot be cancelled.
              </li>
              <li>COD orders can be cancelled before dispatch by calling us directly.</li>
              <li>Once shipped, cancellation is not possible — you may raise a return request upon delivery.</li>
              <li>Prepaid cancellations will be refunded to the original payment method within 3–5 business days.</li>
            </ul>
          </Section>

          <Section title="7. Contact for Returns">
            <p>
              Email:{" "}
              <a href={`mailto:${BRAND.email}`} className="text-[#006A38] font-medium hover:underline">{BRAND.email}</a>
              <br />
              Phone: <strong>{BRAND.phone}</strong> (Mon–Sat, 9 AM – 6 PM IST)
            </p>
            <p className="mt-2">
              Please keep your order confirmation email handy when contacting us for faster resolution.
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
