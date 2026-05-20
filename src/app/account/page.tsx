'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Clock, Lock } from 'lucide-react';
import Logo from '@/components/ui/Logo';

type Tab = 'profile' | 'history' | 'settings';

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string;
}

interface HistoryItem {
  id: string;
  created_at: string;
  validated_at: string;
  points_redeemed: number;
  status: string;
  cycle_number: number;
  reward_description: string;
  campaign_name: string;
  merchant_name: string;
  brand_color: string;
  logo_svg: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── History state ──────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Password state ─────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load profile on mount
  useEffect(() => {
    fetch('/api/customer/profile')
      .then(async (res) => {
        if (res.status === 401) { router.replace('/auth/login'); return; }
        const data: ProfileData = await res.json();
        setProfile(data);
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
        setEmail(data.email ?? '');
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [router]);

  // Load history when switching to history tab
  useEffect(() => {
    if (tab !== 'history' || history !== null) return;
    setHistoryLoading(true);
    fetch('/api/customer/history')
      .then(async (res) => {
        if (res.status === 401) { router.replace('/auth/login'); return; }
        const data: HistoryItem[] = await res.json();
        setHistory(data);
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [tab, history, router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api/customer/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to update password');
      setPwMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update' });
    } finally {
      setPwSaving(false);
    }
  }

  const tabBtn = (id: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        tab === id
          ? 'bg-primary text-white shadow'
          : 'text-text-medium hover:bg-brand-bg'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-brand-bg pb-16">
      {/* Header */}
      <header className="bg-white border-b border-brand-border sticky top-0 z-30">
        <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 -ml-1.5 text-text-medium hover:text-text-dark">
            <ArrowLeft size={20} />
          </Link>
          <Link href="/"><Logo variant="light" size={20} /></Link>
          <span className="text-text-light mx-1">/</span>
          <span className="font-jakarta font-bold text-sm text-text-dark">My Account</span>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-6">
        {/* Tab bar */}
        <div className="flex gap-2 bg-white rounded-xl border border-brand-border shadow-card p-2">
          {tabBtn('profile',  <User  size={16} />, 'Profile')}
          {tabBtn('history',  <Clock size={16} />, 'History')}
          {tabBtn('settings', <Lock  size={16} />, 'Password')}
        </div>

        {/* ── Profile tab ─────────────────────────────────────────────────── */}
        {tab === 'profile' && (
          <div className="bg-white rounded-xl border border-brand-border shadow-card p-5">
            <h2 className="font-jakarta font-bold text-xl mb-5">Profile</h2>
            {profileLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
              </div>
            ) : (
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-1">First Name</label>
                  <input
                    className="form-input"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-1">Last Name</label>
                  <input
                    className="form-input"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-1">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-1">Phone Number</label>
                  <input
                    className="form-input bg-brand-bg cursor-not-allowed opacity-60"
                    value={profile?.phone_number ?? ''}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-text-light mt-1">Phone number cannot be changed.</p>
                </div>

                {profileMsg && (
                  <p className={`text-sm font-medium ${profileMsg.type === 'success' ? 'text-primary' : 'text-status-error'}`}>
                    {profileMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn-primary w-full justify-center disabled:opacity-60"
                >
                  {profileSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── History tab ─────────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <h2 className="font-jakarta font-bold text-xl">Redemption History</h2>
            {historyLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-brand-border p-5 animate-pulse space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : !history || history.length === 0 ? (
              <div className="bg-white rounded-xl border border-brand-border shadow-card p-8 text-center space-y-2">
                <p className="text-4xl">🎁</p>
                <p className="font-jakarta font-bold text-lg">No history yet</p>
                <p className="text-text-medium text-sm">
                  Redeem a reward at a store to see it here.
                </p>
              </div>
            ) : (
              history.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-brand-border shadow-card p-5 flex gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: `${item.brand_color}20` }}
                    dangerouslySetInnerHTML={{ __html: item.logo_svg }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-jakarta font-bold text-sm truncate">{item.merchant_name}</p>
                    <p className="text-text-medium text-xs mt-0.5 line-clamp-2">{item.reward_description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: item.brand_color }}
                      >
                        {item.points_redeemed} pts redeemed
                      </span>
                      <span className="text-text-light text-xs">
                        {item.validated_at
                          ? new Date(item.validated_at).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Password tab ────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="bg-white rounded-xl border border-brand-border shadow-card p-5">
            <h2 className="font-jakarta font-bold text-xl mb-5">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-1">Current Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-1">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-1">Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              {pwMsg && (
                <p className={`text-sm font-medium ${pwMsg.type === 'success' ? 'text-primary' : 'text-status-error'}`}>
                  {pwMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={pwSaving}
                className="btn-primary w-full justify-center disabled:opacity-60"
              >
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
