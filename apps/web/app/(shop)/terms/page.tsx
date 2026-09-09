import { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND.name}`,
  description: "Terms and conditions governing use of SriLaYa Naturals website and services.",
};

const LAST_UPDATED = "30 June 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white">Terms of Service</h1>
        <p className="text-green-200 text-sm mt-1">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 space-y-8 text-[#424242] text-sm leading-relaxed">

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using the website <strong>srilaya.com</strong> ("the Website") or purchasing
              products from <strong>{BRAND.name}</strong> ("we", "us", "our"), you agree to be bound by
              these Terms of Service ("Terms"). If you do not agree, please do not use the Website.
            </p>
          </Section>

          <Section title="2. Products">
            <p>
              We sell organic millets, millet-based flours, rava, flakes, and traditional laddus.
              Product descriptions, images, and nutritional information are provided in good faith.
              Minor variations in colour, texture, or packaging may occur due to natural product
              variability and photography conditions. We reserve the right to modify, discontinue,
              or restrict the sale of any product without notice.
            </p>
          </Section>

          <Section title="3. Orders and Payment">
            <ul className="list-disc pl-5 space-y-2">
              <li>Orders are confirmed via email or SMS after successful payment or COD acceptance.</li>
              <li>Prices are in Indian Rupees (INR) and include applicable GST.</li>
              <li>We accept UPI, credit/debit cards, net banking (via Razorpay), and Cash on Delivery (COD).</li>
              <li>COD orders are accepted at our discretion and may be withdrawn in certain pin codes.</li>
              <li>We reserve the right to cancel any order for reasons including payment failure, stock unavailability, or suspected fraud. A full refund will be issued in such cases.</li>
            </ul>
          </Section>

          <Section title="4. Pricing and GST">
            <p>
              All listed prices are inclusive of GST as applicable under Indian law. Our GSTIN is{" "}
              <strong>{BRAND.gstin ?? "29XXXXX1234X1ZX"}</strong>. Tax invoices are generated for every
              order and sent by email or available on request.
            </p>
          </Section>

          <Section title="5. Shipping">
            <p>
              Please refer to our{" "}
              <a href="/shipping-policy" className="text-[#006A38] font-medium hover:underline">Shipping Policy</a>{" "}
              for delivery timelines, pin code coverage, and charges. Title and risk of loss pass to
              you upon delivery to the address provided at checkout.
            </p>
          </Section>

          <Section title="6. Returns and Refunds">
            <p>
              Please refer to our{" "}
              <a href="/returns-policy" className="text-[#006A38] font-medium hover:underline">Returns & Refund Policy</a>{" "}
              for full details. In brief, we accept returns within 7 days of delivery for damaged or
              defective products. Perishable items cannot be returned unless defective.
            </p>
          </Section>

          <Section title="7. Loyalty Points and Coupons">
            <ul className="list-disc pl-5 space-y-2">
              <li>Loyalty points are earned on eligible purchases and have no monetary value outside our platform.</li>
              <li>Points may be redeemed on future orders subject to minimum balances and caps per order.</li>
              <li>Coupon codes are non-transferable, single-use unless stated otherwise, and may be withdrawn at any time.</li>
              <li>We reserve the right to void points or coupons obtained through fraudulent means.</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              All content on the Website — including product images, descriptions, logos, and branding —
              is owned by or licensed to {BRAND.name}. You may not reproduce, distribute, or create
              derivative works without our written permission.
            </p>
          </Section>

          <Section title="9. User Accounts">
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              You agree to notify us immediately of any unauthorised access. We are not liable for
              losses resulting from unauthorised use of your account.
            </p>
          </Section>

          <Section title="10. Prohibited Conduct">
            <ul className="list-disc pl-5 space-y-2">
              <li>Placing orders with false or fraudulent payment information.</li>
              <li>Reselling our products commercially without prior written consent.</li>
              <li>Attempting to scrape, crawl, or automate requests to the Website.</li>
              <li>Submitting false reviews, ratings, or referrals.</li>
            </ul>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, {BRAND.name} shall not be liable
              for any indirect, incidental, special, or consequential damages arising from use of
              the Website or our products. Our total liability for any claim shall not exceed the
              amount paid by you for the specific order giving rise to the claim.
            </p>
          </Section>

          <Section title="12. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of courts in <strong>Bengaluru, Karnataka</strong>. We encourage
              you to contact us at{" "}
              <a href={`mailto:${BRAND.email}`} className="text-[#006A38] hover:underline">{BRAND.email}</a>{" "}
              before initiating legal proceedings, as most issues can be resolved amicably.
            </p>
          </Section>

          <Section title="13. Changes to Terms">
            <p>
              We may update these Terms from time to time. Continued use of the Website after any
              changes constitutes acceptance. The "Last updated" date will reflect the most recent revision.
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
