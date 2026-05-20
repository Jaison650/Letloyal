'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

function StrengthBar({ password }: { password: string }) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-accent'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex gap-1 flex-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[score-1] : 'bg-brand-border'}`} />
        ))}
      </div>
      <span className="text-xs font-medium text-text-light">{labels[Math.max(0,score-1)]}</span>
    </div>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone.trim(), password, first_name: firstName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(redirect);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#0D9488"/>
              <path d="M12 10h5v16h9v4H12V10z" fill="white"/>
              <path d="M26 22l5 5-5 5" stroke="#5EEAD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M31 27H20" stroke="#5EEAD4" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="font-jakarta font-bold text-xl text-text-dark tracking-tight">
              <span className="text-primary">Let</span>Loyal
            </span>
          </Link>
          <h1 className="font-jakarta font-bold text-3xl mt-6">Create Your Loyalty Account</h1>
          <p className="text-text-medium mt-2">Earn rewards at local stores — no apps needed.</p>
        </div>

        {/* Demo info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex gap-3">
          <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            <strong>Demo:</strong> Your account is real and you can scan QR codes at our 6 demo stores. Phone verification is skipped for the demo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="w-full">
            <label className="form-label">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="tel"
                inputMode="tel"
                placeholder="+371 2000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input pl-11"
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className="w-full">
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-11 pr-11"
                autoComplete="new-password"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark" aria-label="Toggle password visibility">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <StrengthBar password={password} />
          </div>

          <div className="w-full">
            <label className="form-label text-text-light">First Name <span className="font-normal">(optional)</span></label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="text"
                placeholder="e.g. Māris"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input pl-11"
                autoComplete="given-name"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-status-error flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">Create Account →</Button>

          <p className="text-xs text-text-light text-center pt-2">
            By creating an account you agree to our Terms of Service.
          </p>
        </form>

        <p className="text-center text-sm text-text-medium">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-96 h-96 rounded-2xl" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
