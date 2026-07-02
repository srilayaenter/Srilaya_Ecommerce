import ChangePasswordForm from "./ChangePasswordForm";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 font-sans max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#212121]">Store Settings</h1>
        <p className="text-sm text-[#8D6E63] mt-1">Manage admin account security and store configuration.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
        <h2 className="text-base font-bold text-[#212121] mb-4">Change Password</h2>
        <ChangePasswordForm />
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6">
        <h2 className="text-base font-bold text-[#212121] mb-3">Environment Setup Checklist</h2>
        <ul className="space-y-2 text-sm text-[#424242]">
          {[
            ["DATABASE_URL", "Supabase connection string"],
            ["NEXTAUTH_SECRET", "Random 32+ char secret"],
            ["NEXTAUTH_URL", "Your production domain (https://...)"],
            ["RESEND_API_KEY", "Resend email API key"],
            ["RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET", "Razorpay live keys"],
            ["GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET", "Google OAuth credentials"],
            ["TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM", "WhatsApp via Twilio"],
            ["BRAND_GSTIN", "Your GST registration number"],
          ].map(([key, desc]) => (
            <li key={key} className="flex items-start gap-2">
              <span className="text-[#006A38] mt-0.5 flex-shrink-0">✓</span>
              <div>
                <code className="text-xs bg-[#F5F5F5] border border-[#E0E0E0] px-1.5 py-0.5 rounded font-mono">{key}</code>
                <span className="text-[#9E9E9E] ml-2 text-xs">{desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
