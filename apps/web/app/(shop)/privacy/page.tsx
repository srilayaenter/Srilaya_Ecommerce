import { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.name}`,
  description: "How SriLaYa Naturals collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "18 July 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white">Privacy Policy</h1>
        <p className="text-green-200 text-sm mt-1">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 space-y-8 text-[#424242] text-sm leading-relaxed">

          <Section title="1. Who We Are">
            <p>
              <strong>{BRAND.name}</strong> ("we", "us", "our") operates the website{" "}
              <strong>srilaya.com</strong> and sells organic millets, millet-based flours, rava, flakes,
              and traditional laddus across India. Our registered address is{" "}
              <strong>{BRAND.address}</strong>. For any privacy-related queries, write to us at{" "}
              <a href={`mailto:${BRAND.email}`} className="text-[#006A38] font-medium hover:underline">{BRAND.email}</a>.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account data</strong> — name, email address, phone number, and password (hashed) when you create an account or sign in via Google/phone OTP.</li>
              <li><strong>Order data</strong> — shipping address, city, state, PIN code, and payment method when you place an order.</li>
              <li><strong>Payment data</strong> — we do not store card numbers or UPI credentials. Payments are processed by Razorpay. We receive only a transaction reference ID.</li>
              <li><strong>Usage data</strong> — pages visited, products viewed, cart activity, and search queries, collected via server logs and cookies.</li>
              <li><strong>Communications</strong> — messages sent through our contact form or customer support email.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To process and fulfil your orders, generate invoices, and arrange delivery.</li>
              <li>To send order confirmation, dispatch, and delivery notification emails and SMS.</li>
              <li>To manage your loyalty points, referral rewards, and coupon eligibility.</li>
              <li>To respond to your queries and complaints.</li>
              <li>To detect and prevent fraud or abuse.</li>
              <li>To improve our website, product range, and customer experience.</li>
              <li>To comply with legal and regulatory obligations under Indian law.</li>
            </ul>
          </Section>

          <Section title="4. Sharing of Information">
            <p className="mb-3">We do not sell your personal data. We share information only with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Payment processors</strong> — Razorpay, for processing online payments.</li>
              <li><strong>Logistics partners</strong> — courier companies (DTDC, Bluedart, Delhivery, etc.) receive your name, phone, and delivery address solely to fulfil your order.</li>
              <li><strong>Email and SMS providers</strong> — Resend (email) and Twilio (SMS) receive your contact details to deliver transactional messages.</li>
              <li><strong>Legal authorities</strong> — when required by law, court order, or government directive.</li>
            </ul>
          </Section>

          <Section title="5. Cookies">
            <p>
              We use cookies to maintain your shopping cart session, remember your login, and analyse
              site traffic. No third-party advertising cookies are used. You may disable cookies in
              your browser settings, but this may affect core site functionality such as the cart and
              checkout.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              Order and invoice data is retained for a minimum of 7 years as required by Indian
              accounting and GST regulations. Account data is retained until you request deletion.
              OTP records are deleted immediately after verification or upon expiry (10 minutes).
            </p>
          </Section>

          <Section title="7. Your Rights">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — ask us to correct inaccurate data.</li>
              <li><strong>Deletion</strong> — request deletion of your account and personal data, subject to legal retention requirements.</li>
              <li><strong>Grievance redressal</strong> — under the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, you may raise a complaint with our Grievance Officer at <a href={`mailto:${BRAND.email}`} className="text-[#006A38] hover:underline">{BRAND.email}</a>. We will respond within 30 days.</li>
            </ul>
          </Section>

          <Section title="8. Security">
            <p>
              All data is transmitted over HTTPS. Passwords are hashed using bcrypt and never stored
              in plain text. Payment credentials are never stored on our servers. We perform regular
              security reviews of our infrastructure hosted on Supabase (PostgreSQL) and Vercel.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Our services are not directed at children under 13. We do not knowingly collect personal
              data from children. If you believe we have inadvertently collected such data, contact us
              and we will delete it promptly.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this policy from time to time. The "Last updated" date at the top will
              reflect the latest revision. Continued use of the website after changes constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Your Rights Under the Digital Personal Data Protection Act 2023 (DPDP)">
            <p className="mb-3">
              Under India's <strong>Digital Personal Data Protection Act 2023</strong>, you have the
              following rights as a <strong>Data Principal</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Right to Access</strong> — Request a summary of the personal data we hold
                about you and the purposes for which it is being processed.
              </li>
              <li>
                <strong>Right to Correction</strong> — Request correction of inaccurate or
                incomplete personal data.
              </li>
              <li>
                <strong>Right to Erasure</strong> — Request deletion of your personal data when it
                is no longer necessary for the purpose it was collected, subject to legal retention
                obligations (e.g., GST invoice records must be retained for 6 years under Indian tax law).
              </li>
              <li>
                <strong>Right to Grievance Redressal</strong> — Raise a complaint or grievance
                about how we handle your personal data. We will respond within 30 days.
              </li>
              <li>
                <strong>Right to Nominate</strong> — Nominate another person to exercise your
                rights in the event of your death or incapacity.
              </li>
            </ul>
            <p className="mb-3">
              To exercise any of these rights, write to us at{" "}
              <a href={`mailto:${BRAND.email}`} className="text-[#006A38] font-medium hover:underline">
                {BRAND.email}
              </a>{" "}
              with the subject line <strong>"DPDP Data Rights Request"</strong>. Please include
              your full name, email address used at checkout, and a description of your request.
              We will acknowledge your request within 3 business days and resolve it within 30
              days.
            </p>
            <p>
              <strong>Data Fiduciary:</strong> {BRAND.name}, {BRAND.address}.{" "}
              For escalations that we have not resolved to your satisfaction, you may approach the
              <strong> Data Protection Board of India</strong> once it is constituted under the Act.
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
