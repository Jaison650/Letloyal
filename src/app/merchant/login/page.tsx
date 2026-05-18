'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, Lock, Eye, EyeOff, ChevronDown, AlertCircle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';

const DEMO_MERCHANTS = [
  { slug: 'brewhouse-cafe',  label: 'BrewHouse Café — Riga'        },
  { slug: 'bella-beauty',    label: 'Bella Beauty Salon — Riga'    },
  { slug: 'the-fit-club',    label: 'The Fit Club — Tallinn'       },
  { slug: 'metro-deli',      label: 'Metro Deli — Vilnius'         },
  { slug: 'luxe-boutique',   label: 'Luxe Boutique — Riga'         },
  { slug: 'casa-pizzeria',   label: 'Casa Pizzeria — Tallinn'      },
];

export default function MerchantLoginPage() {
  const router = useRouter();
  const [slug,    setSlug]    = useState('brewhouse-cafe');
  const [useCustom, setUseCustom] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveSlug = useCustom ? customSlug.trim() : slug;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveSlug) { setError('Please select or enter your store.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/merchant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: effectiveSlug, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/merchant/${data.slug}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] space-y-6">

        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-sora font-extrabold text-2xl text-primary">
            <QrCode size={28} /> LetLoyal
          </Link>
          <h1 className="font-sora font-bold text-[28px] mt-5 text-text-dark">Merchant Login</h1>
          <p className="text-text-medium mt-1.5 text-sm">Access your loyalty dashboard</p>
        </div>

        {/* Demo credentials banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 flex gap-3">
          <Info size={17} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 space-y-1">
            <p className="font-semibold">Demo credentials</p>
            <p>Select any store below and use password:&nbsp;
              <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">demo1234</code>
            </p>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-7 border border-brand-border shadow-card space-y-5">

          {/* Store selector */}
          <div>
            <label className="form-label">Your Store</label>
            {!useCustom ? (
              <div className="relative">
                <select
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="form-input appearance-none pr-10 cursor-pointer"
                >
                  {DEMO_MERCHANTS.map(m => (
                    <option key={m.slug} value={m.slug}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                placeholder="your-store-slug"
                value={customSlug}
                onChange={e => setCustomSlug(e.target.value)}
                className="form-input"
                autoFocus
                autoComplete="off"
              />
            )}
            <button
              type="button"
              onClick={() => { setUseCustom(v => !v); setCustomSlug(''); }}
              className="text-xs text-primary hover:underline mt-1.5 float-right"
            >
              {useCustom ? '← Back to demo list' : 'Enter slug manually'}
            </button>
          </div>

          {/* Password */}
          <div className="clear-both">
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="demo1234"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input pl-11 pr-11"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-status-error flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Sign In to Dashboard →
          </Button>
        </form>

        <p className="text-center text-sm text-text-medium">
          Are you a customer?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">Sign in here</Link>
        </p>
        <p className="text-center text-xs text-text-light">
          <Link href="/" className="hover:text-primary transition-colors">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
