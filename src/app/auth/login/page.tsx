'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone.trim(), password }),
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
          <Link href="/"><Logo variant="light" size={30} /></Link>
          <h1 className="font-jakarta font-bold text-3xl mt-6">Welcome Back</h1>
          <p className="text-text-medium mt-2">Sign in to your loyalty account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
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
                autoFocus
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-11 pr-11"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark" aria-label="Toggle password">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => alert('Password reset is not available in the demo. Try signing up with a new account.')}
              className="text-xs text-text-light hover:text-primary mt-1.5 float-right transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-status-error flex items-center gap-2 clear-both">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg" className="clear-both">Sign In →</Button>
        </form>

        <p className="text-center text-sm text-text-medium">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-primary font-semibold hover:underline">Register Free</Link>
        </p>
        <p className="text-center text-xs text-text-light">
          <Link href="/" className="hover:text-primary">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="skeleton w-96 h-96 rounded-2xl" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
