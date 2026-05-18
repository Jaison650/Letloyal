import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getMerchantBySlug, getActiveCampaigns } from '@/lib/merchants';
import { queryOne } from '@/lib/db';
import { getAuthFromCookies, isCustomer } from '@/lib/auth';
import ScanSuccess from '@/components/customer/ScanSuccess';
import ProgressBar from '@/components/ui/ProgressBar';
import { ChevronRight, CheckCircle2, AlertCircle, MapPin, QrCode, Gift } from 'lucide-react';

interface PageProps {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string; a?: string; ts?: string; sig?: string }>;
}

export default async function StorePage({ params, searchParams }: PageProps) {
  const { slug }                              = await params;
  const { c: campaignId, a: amountCents, ts, sig } = await searchParams;

  // ── merchant + campaign ──────────────────────────────────────────────────
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  const campaigns = await getActiveCampaigns(merchant.id);
  const campaign  = campaignId ? campaigns.find(c => c.id === campaignId) : campaigns[0];

  if (!campaign) {
    return (
      <StoreShell merchant={merchant}>
        <div className="flex flex-col items-center text-center py-10 space-y-3">
          <AlertCircle size={44} className="text-status-warning" />
          <h2 className="font-sora font-bold text-xl">Program Paused</h2>
          <p className="text-text-medium text-sm">
            This loyalty campaign is temporarily paused. Check back soon!
          </p>
        </div>
      </StoreShell>
    );
  }

  // ── auth ─────────────────────────────────────────────────────────────────
  const auth       = await getAuthFromCookies();
  const isLoggedIn = auth && isCustomer(auth);

  // ── server-side scan (when customer arrives via QR link) ─────────────────
  if (isLoggedIn && campaignId) {
    const cookieStore = await cookies();
    const authToken   = cookieStore.get('letloyal_auth')?.value ?? '';

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const body: Record<string, unknown> = { campaign_id: campaignId };

    if (campaign.campaign_type === 'spend_based' && amountCents && ts && sig) {
      body.a         = parseInt(amountCents, 10);
      body.ts        = ts;
      body.sig       = sig;
      body.amount_euros = parseInt(amountCents, 10) / 100;
    }

    try {
      const scanRes  = await fetch(`${baseUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `letloyal_auth=${authToken}`,
        },
        body:  JSON.stringify(body),
        cache: 'no-store',
      });
      const scanData = await scanRes.json();

      // Already scanned this visit
      if (scanData.already_scanned) {
        const enrollment = await queryOne<{
          points_balance: number;
          visit_count: number;
          status: string;
        }>(
          'SELECT points_balance, visit_count, status FROM enrollments WHERE customer_id = ? AND campaign_id = ?',
          [auth.sub, campaignId],
        );
        const current = enrollment
          ? (campaign.campaign_type === 'visit_based'
              ? enrollment.visit_count
              : enrollment.points_balance)
          : (scanData.current_count ?? 0);

        return (
          <AlreadyScanned
            merchantName={merchant.business_name}
            merchantColor={merchant.brand_color}
            current={current}
            threshold={campaign.reward_threshold}
            campaignType={campaign.campaign_type}
            rewardDescription={campaign.reward_description}
          />
        );
      }

      // Successful scan
      if (scanData.success) {
        return (
          <ScanSuccess
            merchantName={merchant.business_name}
            merchantColor={merchant.brand_color}
            rewardDescription={campaign.reward_description}
            pointsAdded={scanData.points_added ?? 1}
            newTotal={scanData.current_count}
            threshold={campaign.reward_threshold}
            rewardUnlocked={scanData.reward_unlocked}
            campaignType={campaign.campaign_type as 'visit_based' | 'spend_based'}
          />
        );
      }
    } catch {
      // fall through to normal page render
    }
  }

  // ── enrollment state (for logged-in progress display) ────────────────────
  const enrollment = isLoggedIn
    ? await queryOne<{ points_balance: number; visit_count: number; status: string }>(
        'SELECT points_balance, visit_count, status FROM enrollments WHERE customer_id = ? AND campaign_id = ?',
        [auth.sub, campaignId || campaign.id],
      )
    : null;

  const current   = enrollment
    ? (campaign.campaign_type === 'visit_based' ? enrollment.visit_count : enrollment.points_balance)
    : 0;
  const pct       = enrollment ? Math.min(100, Math.round((current / campaign.reward_threshold) * 100)) : 0;
  const remaining = Math.max(0, campaign.reward_threshold - current);
  const unit      = campaign.campaign_type === 'visit_based' ? 'visit' : 'point';

  // ── redirect URLs preserve all QR params ─────────────────────────────────
  const qrSuffix  = campaignId
    ? `?c=${campaign.id}${amountCents ? `&a=${amountCents}&ts=${ts}&sig=${sig}` : ''}`
    : `?c=${campaign.id}`;
  const signInUrl = `/auth/login?redirect=/store/${slug}${encodeURIComponent(qrSuffix)}`;
  const signUpUrl = `/auth/signup?redirect=/store/${slug}${encodeURIComponent(qrSuffix)}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-brand-bg"
      style={{ '--brand': merchant.brand_color } as React.CSSProperties}
    >
      <div className="w-full max-w-[430px] space-y-5 animate-slide-up">

        {/* Merchant branding */}
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden flex items-center justify-center"
            style={{ background: `${merchant.brand_color}18`, border: `2px solid ${merchant.brand_color}30` }}
            dangerouslySetInnerHTML={{ __html: merchant.logo_svg }}
          />
          <h1 className="font-sora font-bold text-2xl text-text-dark">{merchant.business_name}</h1>
          <p className="text-text-medium text-sm flex items-center justify-center gap-1 mt-1">
            <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-brand-border text-text-medium">
              {merchant.category}
            </span>
            <MapPin size={11} className="ml-1" />
            <span>{merchant.city}</span>
          </p>
        </div>

        {/* Campaign card */}
        <div className="bg-white rounded-[20px] border border-brand-border shadow-card p-5 space-y-4">
          {/* Reward headline */}
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">🎁</span>
            <div>
              <p className="font-sora font-bold text-base text-text-dark">{campaign.reward_description}</p>
              <p className="text-text-medium text-xs mt-0.5">
                {campaign.campaign_type === 'visit_based'
                  ? `Visit ${campaign.reward_threshold} times to earn your reward`
                  : `Spend €${campaign.reward_threshold} to earn your reward`}
              </p>
            </div>
          </div>

          {/* Progress (logged-in) */}
          {enrollment ? (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs font-medium text-text-medium mb-1">
                <span>{current} / {campaign.reward_threshold} {unit}s</span>
                <span style={{ color: merchant.brand_color }}>
                  {enrollment.status === 'reward_unlocked'
                    ? '🎉 Ready to redeem!'
                    : `${remaining} more ${unit}${remaining !== 1 ? 's' : ''} to go`}
                </span>
              </div>
              <ProgressBar value={pct} />
              {enrollment.status === 'reward_unlocked' && (
                <p className="text-xs font-semibold text-center pt-1" style={{ color: merchant.brand_color }}>
                  Your reward is unlocked! Go to your dashboard to redeem it.
                </p>
              )}
            </div>
          ) : (
            /* Greyed-out placeholder for non-logged-in users */
            <div className="space-y-2 pt-1 opacity-30 pointer-events-none select-none">
              <div className="flex justify-between text-xs text-text-light mb-1">
                <span>0 / {campaign.reward_threshold} {unit}s</span>
                <span>{campaign.reward_threshold} more to go</span>
              </div>
              <ProgressBar value={0} />
            </div>
          )}
        </div>

        {/* CTAs */}
        {!isLoggedIn && (
          <div className="space-y-3">
            <Link
              href={signInUrl}
              className="flex items-center justify-center gap-2 w-full font-bold text-base text-white rounded-full py-3.5 min-h-[48px] transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: merchant.brand_color }}
            >
              Sign In to Earn Points <ChevronRight size={16} />
            </Link>
            <Link
              href={signUpUrl}
              className="flex items-center justify-center gap-2 w-full font-semibold text-base rounded-full py-3.5 min-h-[48px] border-2 transition-all duration-200 hover:opacity-80"
              style={{ borderColor: merchant.brand_color, color: merchant.brand_color }}
            >
              Register — It&apos;s Free
            </Link>

            {/* Trust badges */}
            <div className="pt-1 space-y-1.5 text-center">
              <p className="text-xs text-text-light flex items-center justify-center gap-1.5">
                <CheckCircle2 size={12} className="text-accent shrink-0" />
                No app download needed
              </p>
              <p className="text-xs text-text-light flex items-center justify-center gap-1.5">
                <CheckCircle2 size={12} className="text-accent shrink-0" />
                Join in under 60 seconds
              </p>
            </div>
          </div>
        )}

        {/* Logged in — no campaign in URL yet */}
        {isLoggedIn && !campaignId && (
          <Link
            href={`/store/${slug}?c=${campaign.id}`}
            className="flex items-center justify-center gap-2 w-full font-bold text-base text-white rounded-full py-3.5 min-h-[48px]"
            style={{ background: merchant.brand_color }}
          >
            <Gift size={16} /> Earn Points Now
          </Link>
        )}

        {/* Logged in — has campaign, not unlocked */}
        {isLoggedIn && campaignId && enrollment?.status !== 'reward_unlocked' && (
          <Link href="/dashboard" className="btn-ghost w-full justify-center text-sm">
            View My Dashboard
          </Link>
        )}

        {/* Logged in — reward ready */}
        {isLoggedIn && enrollment?.status === 'reward_unlocked' && (
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full font-bold text-base text-white rounded-full py-3.5 min-h-[48px]"
            style={{ background: merchant.brand_color }}
          >
            Go to Dashboard to Redeem →
          </Link>
        )}

        {/* Powered by */}
        <div className="text-center pt-1">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-text-light hover:text-primary transition-colors">
            <QrCode size={11} /> Powered by LetLoyal
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StoreShell({
  merchant,
  children,
}: {
  merchant: { business_name: string; brand_color: string; logo_svg: string; city: string; category: string };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-brand-bg">
      <div className="w-full max-w-[430px] space-y-5">
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-4"
            style={{ background: `${merchant.brand_color}18` }}
            dangerouslySetInnerHTML={{ __html: merchant.logo_svg }}
          />
          <h1 className="font-sora font-bold text-2xl">{merchant.business_name}</h1>
          <p className="text-text-medium text-sm mt-1">{merchant.city}</p>
        </div>
        <div className="bg-white rounded-[20px] border border-brand-border shadow-card p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function AlreadyScanned({
  merchantName, merchantColor, current, threshold, campaignType, rewardDescription,
}: {
  merchantName: string;
  merchantColor: string;
  current: number;
  threshold: number;
  campaignType: 'visit_based' | 'spend_based';
  rewardDescription: string;
}) {
  const pct  = Math.min(100, Math.round((current / threshold) * 100));
  const unit = campaignType === 'visit_based' ? 'visit' : 'point';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center bg-brand-bg">
      <div className="w-full max-w-[430px] space-y-5 animate-slide-up">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: `${merchantColor}18` }}
        >
          <CheckCircle2 size={36} style={{ color: merchantColor }} />
        </div>

        <div>
          <h2 className="font-sora font-bold text-xl text-text-dark">Already Recorded!</h2>
          <p className="text-text-medium text-sm mt-1.5">
            Points already recorded for this visit to <strong>{merchantName}</strong>. See you next time! 👋
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-brand-border shadow-card p-5 space-y-3">
          <div className="flex justify-between text-xs font-medium text-text-medium">
            <span>Current progress</span>
            <span style={{ color: merchantColor }}>
              {current} / {threshold} {unit}s
            </span>
          </div>
          <ProgressBar value={pct} />
          <p className="text-xs text-text-light border-t border-brand-border pt-2">{rewardDescription}</p>
        </div>

        <Link href="/dashboard" className="btn-primary w-full justify-center">
          View My Dashboard <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
