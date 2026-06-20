import ChangePasswordForm from "./ChangePasswordForm";

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}