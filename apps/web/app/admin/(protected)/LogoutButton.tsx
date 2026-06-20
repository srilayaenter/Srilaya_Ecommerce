'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      className="text-sm text-red-600 hover:text-red-700 font-medium"
    >
      Logout
    </button>
  );
}