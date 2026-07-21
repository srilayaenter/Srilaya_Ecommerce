'use client';

import { useState } from 'react';

export default function ChangePasswordForm() {
  const [email,           setEmail]           = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [message,         setMessage]         = useState('');
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/admin/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('success');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setMessage(data.error || 'Failed to update password');
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm text-[#212121] focus:outline-none focus:border-[#006A38] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" autoComplete="email" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">Current Password</label>
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">New Password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} />
        <p className="text-[11px] text-[#9E9E9E] mt-1">Minimum 8 characters.</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60"
      >
        {loading ? 'Updating…' : 'Update Password'}
      </button>
      {message === 'success' ? (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-lg">
          ✅ Password updated successfully.
        </div>
      ) : message ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-lg">
          {message}
        </div>
      ) : null}
    </form>
  );
}
