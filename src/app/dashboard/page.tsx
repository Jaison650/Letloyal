'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, Camera, ChevronRight } from 'lucide-react';
import LoyaltyCard, { type Enrollment } from '@/components/customer/LoyaltyCard';
import LogoutButton from '@/components/customer/LogoutButton';
import NotificationBell from '@/components/customer/NotificationBell';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface DemoMerchant {
  slug: string;
  business_name: string;
  logo_svg: string;
  category: string;
  brand_color: string;
  reward_description: string;
}

interface DashboardData {
  customer: { id: string; first_name: string; phone_number: string };
  enrollments: Enrollment[];
  demo_merchants: DemoMerchant[];
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[20px] border border-brand-border shadow-card p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="space-y-1.5">
        <div className="h-2.5 bg-gray-200 rounded-full w-full" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-28" />
        </div>
      </div>
      <div className="h-10 bg-gray-200 rounded-xl w-full" />
    </div>
  );
}

export default function CustomerDashboard() {
  const router  = useRouter();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/dashboard')
      .then(async (res) => {
        if (res.status === 401) { router.replace('/auth/login'); return; }
        const json = await res.json();
        setData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const firstName = data?.customer?.first_name;
  const initials  = firstName ? firstName.charAt(0).toUpperCase() : '?';
  const count     = data?.enrollments.length ?? 0;

  return (
    <div className="min-h-screen bg-brand-bg pb-28">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30" style={{ background: 'linear-gradient(90deg, #014451, #028090)' }}>
        <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-sora font-bold text-white text-sm">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <QrCode size={14} className="text-[#012d38]" />
            </div>
            LetLoyal
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <NotificationBell />
            <Link
              href="/account"
              className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-sm font-bold select-none hover:bg-white/30 transition-colors"
              title="My account"
            >
              {loading ? '·' : initials}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-8">

        {/* ── Greeting ─────────────────────────────────────────────── */}
        <div>
          {loading ? (
            <>
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse" />
            </>
          ) : (
            <>
              <h1 className="font-sora font-bold text-2xl">
                Hi{firstName ? `, ${firstName}` : ' there'}! 👋
              </h1>
              <p className="text-text-medium text-sm mt-1">
                {count === 0
                  ? 'Scan a QR code below to start earning rewards.'
                  : `You have ${count} loyalty card${count !== 1 ? 's' : ''}.`}
              </p>
            </>
          )}
        </div>

        {/* ── Loyalty cards ────────────────────────────────────────── */}
        {loading ? (
          <section className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
            <SkeletonCard />
            <SkeletonCard />
          </section>
        ) : count > 0 ? (
          <section className="space-y-4">
            <h2 className="font-sora font-bold text-lg">My Loyalty Cards</h2>
            {data!.enrollments.map((e) => (
              <LoyaltyCard key={e.enrollment_id} enrollment={e} />
            ))}
          </section>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center text-center py-8 space-y-3">
            <p className="text-5xl">🏪</p>
            <p className="font-sora font-bold text-lg">No loyalty cards yet</p>
            <p className="text-text-medium text-sm max-w-xs">
              Visit a store and scan their QR code to start earning rewards.
            </p>
          </div>
        )}

        {/* ── Scan CTA ─────────────────────────────────────────────── */}
        <section>
          <Link
            href="/scan"
            className="flex items-center gap-4 bg-white rounded-[20px] border border-brand-border shadow-card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center shrink-0">
              <Camera size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-sora font-bold text-base">Scan a Store QR Code</p>
              <p className="text-text-medium text-sm mt-0.5">Earn rewards at any LetLoyal store</p>
            </div>
            <ChevronRight size={20} className="text-text-light shrink-0" />
          </Link>
        </section>

        {/* ── Demo stores (unenrolled) ──────────────────────────────── */}
        {!loading && (data?.demo_merchants.length ?? 0) > 0 && (
          <section>
            <h2 className="font-sora font-bold text-lg mb-3">Discover Stores</h2>
            <div className="grid grid-cols-2 gap-3">
              {data!.demo_merchants.map((m) => (
                <Link
                  key={m.slug}
                  href={`/store/${m.slug}`}
                  className="bg-white rounded-2xl border border-brand-border p-4 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                >
                  <div
                    className="w-10 h-10 rounded-xl mb-2 overflow-hidden flex items-center justify-center"
                    style={{ background: `${m.brand_color}20` }}
                    dangerouslySetInnerHTML={{ __html: m.logo_svg }}
                  />
                  <p className="font-semibold text-sm truncate">{m.business_name}</p>
                  <p className="text-xs text-text-light mt-1 leading-tight line-clamp-2">
                    {m.reward_description}
                  </p>
                  <p className="text-xs text-primary font-semibold mt-2">Scan to Join →</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All-enrolled message */}
        {!loading && data && data.demo_merchants.length === 0 && count > 0 && (
          <p className="text-center text-sm text-text-light py-2">
            🎉 You&apos;re enrolled in all demo stores!
          </p>
        )}

      </div>

      {/* ── Bottom nav ───────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border px-6 pb-safe py-2 flex justify-around z-30">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 relative">
          <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
          <QrCode size={20} className="text-primary" />
          <span className="text-[10px] font-bold text-primary">Cards</span>
        </Link>
        <Link href="/scan" className="flex flex-col items-center gap-1">
          <div
            className="w-14 h-9 rounded-full flex items-center justify-center -mt-4 shadow-btn"
            style={{ background: 'linear-gradient(135deg, #028090, #02C39A)' }}
          >
            <Camera size={18} className="text-white" />
          </div>
          <span className="text-[10px] font-semibold text-text-light mt-0.5">Scan</span>
        </Link>
        <LogoutButton />
      </nav>

    </div>
  );
}
