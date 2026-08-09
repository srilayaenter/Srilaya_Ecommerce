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
    </div>
  );
}
