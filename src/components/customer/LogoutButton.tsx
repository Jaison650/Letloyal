'use client';
import { User } from 'lucide-react';

export default function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <button
      onClick={handleLogout}
      className="flex flex-col items-center gap-1 text-text-light"
    >
      <User size={22} />
      <span className="text-[10px] font-semibold">Account</span>
    </button>
  );
}
