import { BRAND } from "@/lib/brand";

export default function PaymentDetailsPage() {
  return (
    <div className="bg-white text-slate-800">
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full">
            Secure Checkout
          </span>
          <h1 className="text-4xl font-extrabold mt-4 mb-3 tracking-tight">
            Payment Methods
          </h1>
          <p className="text-sm md:text-base text-emerald-100 max-w-xl mx-auto font-medium">
            We offer 100% secure, encrypted payment options for a safe and seamless shopping experience.
          </p>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">
              📱
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              UPI &amp; Wallet
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Pay instantly using Google Pay, PhonePe, Paytm, or BHIM directly via your secure mobile app framework.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">
              💳
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Cards &amp; Banking
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              All major Credit/Debit cards (Visa, MasterCard, RuPay) and Net Banking portals across major banks are supported.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">
              🛡️
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Secure Gateway
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Transactions are protected using Industry Standard SSL encryption protocols, keeping your data confidential.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🏦</span> Offline / Direct Bank Transfer Details
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              If you prefer making a manual IMPS / NEFT / RTGS transfer, you can deposit directly to our bank account:
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Account Name</span>
                <span className="font-bold text-slate-800 text-right">{BRAND.name}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Bank Name</span>
                <span className="font-bold text-slate-800 text-right">
                  State Bank of India (SBI)
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Account Number</span>
                <span className="font-mono font-bold text-slate-800 text-right">
                  XXXXXXXX9482
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">IFSC Code</span>
                <span className="font-mono font-bold text-brand-green text-right">
                  SBIN0040182
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 sm:col-span-2">
                <span className="text-slate-500 font-medium">Branch Location</span>
                <span className="font-bold text-slate-800 text-right">
                  Mysuru Main Branch, Karnataka
                </span>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200/70 p-4 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>⚠️ Order Verification Note:</strong> Once you make a direct manual bank deposit, please take a snapshot of the transaction receipt or reference ID and share it with our customer support team over email or WhatsApp along with your Order ID to expedite dispatch approval.
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 text-center text-slate-400 text-xs">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <span>🔒</span> 256-Bit SSL Secured Encryption | <span>📦</span> Safe Delivery Assured
        </p>
      </section>
    </div>
  );
}