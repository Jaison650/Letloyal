import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getMerchantBySlug, getActiveCampaigns } from '@/lib/merchants';
import { queryOne } from '@/lib/db';
import { getAuthFromCookies, isCustomer } from '@/lib/auth';
import ScanSuccess from '@/components/customer/ScanSuccess';
import ProgressBar from '@/components/ui/ProgressBar';
import MilestoneSteps from '@/components/ui/MilestoneSteps';
import {
  ChevronRight, CheckCircle2, AlertCircle, MapPin, Gift,
  Phone, Globe, Clock, ExternalLink,
} from 'lucide-react';
import { PoweredBy } from '@/components/ui/Logo';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string; a?: string; ts?: string; sig?: string }>;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'] as const;
const DAY_LABELS: Record<string, string> = {
  mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday',
  fri:'Friday', sat:'Saturday', sun:'Sunday',
};

function getTodayKey() {
  return DAY_KEYS[new Date().getDay()];
}

function isOpenNow(hours: Record<string, { open: string; close: string } | null> | null) {
  if (!hours) return null;
  const key = getTodayKey();
  const day = hours[key];
  if (!day) return false;
  const now = new Date();
  const [oh, om] = day.open.split(':').map(Number);
  const [ch, cm] = day.close.split(':').map(Number);
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  return nowMins >= oh * 60 + om && nowMins < ch * 60 + cm;
}

// ── page ─────────────────────────────────────────────────────────────────────
export default async function StorePage({ params, searchParams }: PageProps) {
  const { slug }                              = await params;
  const { c: campaignId, a: amountCents, ts, sig } = await searchParams;
  const t = await getTranslations('store');

  const merchant  = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  const campaigns = await getActiveCampaigns(merchant.id);
  const campaign  = campaignId ? campaigns.find(c => c.id === campaignId) : campaigns[0];

  // Auth
  const auth       = await getAuthFromCookies();
  const isLoggedIn = auth && isCustomer(auth);

  // Server-side scan
  if (isLoggedIn && campaignId && campaign) {
    const cookieStore = await cookies();
    const authToken   = cookieStore.get('letloyal_auth')?.value ?? '';
    const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const body: Record<string, unknown> = { campaign_id: campaignId };

    if (campaign.campaign_type === 'spend_based' && amountCents && ts && sig) {
      body.a            = parseInt(amountCents, 10);
      body.ts           = ts;
      body.sig          = sig;
      body.amount_euros = parseInt(amountCents, 10) / 100;
    }

    try {
      const scanRes  = await fetch(`${baseUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `letloyal_auth=${authToken}` },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const scanData = await scanRes.json();

      if (scanData.already_scanned) {
        const enrollment = await queryOne<{ points_balance: number; visit_count: number; status: string }>(
          'SELECT points_balance, visit_count, status FROM enrollments WHERE customer_id = ? AND campaign_id = ?',
          [auth.sub, campaignId],
        );
        const current = enrollment
          ? (campaign.campaign_type === 'visit_based' ? enrollment.visit_count : enrollment.points_balance)
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

      if (scanData.success) {
        return (
          <ScanSuccess
            merchantId={merchant.id}
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
    } catch { /* fall through */ }
  }

  // Enrollment state
  const enrollment = isLoggedIn && campaign
    ? await queryOne<{ points_balance: number; visit_count: number; status: string }>(
        'SELECT points_balance, visit_count, status FROM enrollments WHERE customer_id = ? AND campaign_id = ?',
        [auth.sub, campaignId || campaign.id],
      )
    : null;

  const current   = enrollment
    ? (campaign?.campaign_type === 'visit_based' ? enrollment.visit_count : enrollment.points_balance)
    : 0;
  const threshold = campaign?.reward_threshold ?? 0;
  const pct       = enrollment && threshold ? Math.min(100, Math.round((current / threshold) * 100)) : 0;
  const remaining = Math.max(0, threshold - current);
  const unit      = campaign?.campaign_type === 'visit_based' ? 'visit' : 'point';

  const qrSuffix  = campaign ? `?c=${campaign.id}${amountCents ? `&a=${amountCents}&ts=${ts}&sig=${sig}` : ''}` : '';
  const signInUrl = `/auth/login?redirect=/store/${slug}${encodeURIComponent(qrSuffix)}`;
  const signUpUrl = `/auth/signup?redirect=/store/${slug}${encodeURIComponent(qrSuffix)}`;

  // Working hours helpers
  const todayKey   = getTodayKey();
  const todayHours = merchant.working_hours?.[todayKey];
  const openNow    = isOpenNow(merchant.working_hours as Record<string, { open: string; close: string } | null> | null);
  const logoImg    = merchant.logo_url; // image URL if set

  return (
    <div
      className="min-h-screen bg-brand-bg"
      style={{ '--brand': merchant.brand_color } as React.CSSProperties}
    >
      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden">
        {merchant.banner_url ? (
          <img
            src={merchant.banner_url}
            alt={`${merchant.business_name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, #0F172A, ${merchant.brand_color})` }}
          />
        )}
        {/* gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Logo + name */}
        <div className="absolute bottom-5 left-5 flex items-end gap-4">
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl flex items-center justify-center shrink-0"
            style={{ background: logoImg ? 'transparent' : `${merchant.brand_color}30` }}
          >
            {logoImg ? (
              <img src={logoImg} alt={merchant.business_name} className="w-full h-full object-cover" />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: merchant.logo_svg }} />
            )}
          </div>
          <div>
            <h1 className="font-jakarta font-bold text-2xl text-white leading-tight drop-shadow-md">
              {merchant.business_name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-white/80 capitalize bg-white/15 px-2 py-0.5 rounded-full">
                {merchant.category}
              </span>
              {merchant.city && (
                <span className="text-xs text-white/70 flex items-center gap-1">
                  <MapPin size={10} /> {merchant.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Language switcher */}
        <div className="absolute top-3 right-4">
          <LanguageSwitcher variant="dark" />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-[430px] mx-auto px-4 py-5 space-y-4 animate-slide-up">

        {/* Tagline */}
        {merchant.tagline && (
          <p className="text-sm text-text-medium text-center italic">&ldquo;{merchant.tagline}&rdquo;</p>
        )}

        {/* Open now indicator */}
        {merchant.working_hours && (
          <div className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${openNow ? 'bg-accent animate-pulse' : 'bg-status-error'}`} />
            <span className="text-xs font-semibold text-text-medium">
              {openNow
                ? `Open now${todayHours ? ` · Closes ${todayHours.close}` : ''}`
                : todayHours
                  ? `Closed · Opens today ${todayHours.open}`
                  : 'Closed today'}
            </span>
          </div>
        )}

        {/* ── Loyalty card ── */}
        {campaign ? (
          <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
            <div
              className="px-5 py-4 text-white"
              style={{ background: `linear-gradient(135deg, ${merchant.brand_color}, ${merchant.brand_color}bb)` }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Gift size={14} className="text-white/80" />
                <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Your Reward</p>
              </div>
              <p className="font-jakarta font-bold text-base leading-snug">{campaign.reward_description}</p>
              <p className="text-white/70 text-xs mt-1">
                {campaign.campaign_type === 'visit_based'
                  ? `${campaign.reward_threshold} visits to unlock`
                  : `€${campaign.reward_threshold} spend to unlock`}
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {enrollment ? (
                <>
                  {threshold <= 12 ? (
                    <div className="flex flex-col items-center gap-2 py-1">
                      <MilestoneSteps current={current} total={threshold} color={merchant.brand_color} size="lg" showLabels />
                      <p className="text-xs font-semibold" style={{ color: merchant.brand_color }}>
                        {enrollment.status === 'reward_unlocked'
                          ? '🎉 Reward ready to redeem!'
                          : `${remaining} more ${unit}${remaining !== 1 ? 's' : ''} to go`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs font-medium text-text-medium mb-1">
                        <span>{current} / {threshold} {unit}s</span>
                        <span style={{ color: merchant.brand_color }}>
                          {enrollment.status === 'reward_unlocked' ? '🎉 Ready!' : `${remaining} more to go`}
                        </span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>
                  )}
                  {enrollment.status === 'reward_unlocked' && (
                    <div className="text-center py-2 rounded-xl text-white text-xs font-bold"
                      style={{ background: merchant.brand_color }}>
                      🎉 Go to your dashboard to redeem!
                    </div>
                  )}
                </>
              ) : (
                <div className="opacity-30 pointer-events-none select-none space-y-3 py-1">
                  {threshold <= 12 ? (
                    <MilestoneSteps current={0} total={threshold} color={merchant.brand_color} size="lg" showLabels />
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-text-light mb-1">
                        <span>0 / {threshold} {unit}s</span>
                        <span>{threshold} more to go</span>
                      </div>
                      <ProgressBar value={0} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-border shadow-card p-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle size={36} className="text-status-warning" />
            <p className="font-jakarta font-bold text-lg">No active campaign</p>
            <p className="text-sm text-text-medium">Check back soon — a new rewards program is coming!</p>
          </div>
        )}

        {/* ── CTAs ── */}
        {!isLoggedIn && campaign && (
          <div className="space-y-3">
            <Link href={signInUrl}
              className="flex items-center justify-center gap-2 w-full font-bold text-base text-white rounded-full py-3.5 min-h-[48px] transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: merchant.brand_color }}>
              {t('joinProgram')} <ChevronRight size={16} />
            </Link>
            <Link href={signUpUrl}
              className="flex items-center justify-center gap-2 w-full font-semibold text-base rounded-full py-3.5 min-h-[48px] border-2 transition-all hover:opacity-80"
              style={{ borderColor: merchant.brand_color, color: merchant.brand_color }}>
              {t('registerFree')}
            </Link>
            <div className="pt-1 space-y-1.5 text-center">
              <p className="text-xs text-text-light flex items-center justify-center gap-1.5">
                <CheckCircle2 size={12} className="text-accent shrink-0" /> {t('noAppNeeded')}
              </p>
              <p className="text-xs text-text-light flex items-center justify-center gap-1.5">
                <CheckCircle2 size={12} className="text-accent shrink-0" /> {t('joinIn60')}
              </p>
            </div>
          </div>
        )}
        {isLoggedIn && campaign && enrollment?.status !== 'reward_unlocked' && (
          <Link href="/dashboard" className="btn-ghost w-full justify-center text-sm">
            {t('viewDashboard')}
          </Link>
        )}
        {isLoggedIn && enrollment?.status === 'reward_unlocked' && (
          <Link href="/dashboard"
            className="flex items-center justify-center gap-2 w-full font-bold text-base text-white rounded-full py-3.5 min-h-[48px]"
            style={{ background: merchant.brand_color }}>
            {t('goRedeem')}
          </Link>
        )}

        {/* ── Business info ── */}
        {(merchant.address || merchant.contact_phone || merchant.website || merchant.working_hours || merchant.map_url) && (
          <div className="bg-white rounded-xl border border-brand-border shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-border"
              style={{ background: `${merchant.brand_color}08` }}>
              <p className="text-xs font-bold text-text-medium uppercase tracking-widest">Store Info</p>
            </div>
            <div className="divide-y divide-brand-border">

              {/* Address + map */}
              {merchant.address && (
                <div className="flex items-start gap-3 px-5 py-3.5">
                  <MapPin size={15} className="text-text-light mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-dark">{merchant.address}</p>
                    {merchant.city && <p className="text-xs text-text-light">{merchant.city}</p>}
                  </div>
                  {merchant.map_url && (
                    <a href={merchant.map_url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                      style={{ background: `${merchant.brand_color}15`, color: merchant.brand_color }}>
                      <ExternalLink size={11} /> Directions
                    </a>
                  )}
                </div>
              )}

              {/* Phone */}
              {merchant.contact_phone && (
                <a href={`tel:${merchant.contact_phone}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-brand-bg transition-colors">
                  <Phone size={15} className="text-text-light shrink-0" />
                  <span className="text-sm text-text-dark">{merchant.contact_phone}</span>
                </a>
              )}

              {/* Website */}
              {merchant.website && (
                <a href={merchant.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-brand-bg transition-colors">
                  <Globe size={15} className="text-text-light shrink-0" />
                  <span className="text-sm text-text-dark truncate">
                    {merchant.website.replace(/^https?:\/\//, '')}
                  </span>
                  <ExternalLink size={11} className="text-text-light shrink-0 ml-auto" />
                </a>
              )}

              {/* Working hours */}
              {merchant.working_hours && (
                <div className="px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className="text-text-light" />
                    <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Opening Hours</p>
                  </div>
                  <div className="space-y-1.5">
                    {DAY_KEYS.map(key => {
                      const d = (merchant.working_hours as Record<string, { open: string; close: string } | null> | null)?.[key];
                      const isToday = key === todayKey;
                      return (
                        <div key={key}
                          className={`flex items-center justify-between text-xs rounded-lg px-2 py-1 ${isToday ? 'font-bold' : ''}`}
                          style={isToday ? { background: `${merchant.brand_color}10`, color: merchant.brand_color } : {}}>
                          <span className={isToday ? '' : 'text-text-medium'}>{DAY_LABELS[key]}</span>
                          {d ? (
                            <span className={isToday ? '' : 'text-text-dark'}>{d.open} – {d.close}</span>
                          ) : (
                            <span className="text-text-light italic">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Powered by */}
        <div className="flex items-center justify-between pt-1 pb-4">
          <PoweredBy />
          <LanguageSwitcher variant="light" />
        </div>
      </div>
    </div>
  );
}

// ── AlreadyScanned sub-component ──────────────────────────────────────────────
function AlreadyScanned({ merchantName, merchantColor, current, threshold, campaignType, rewardDescription }:
  { merchantName: string; merchantColor: string; current: number; threshold: number; campaignType: string; rewardDescription: string }) {
  const pct  = Math.min(100, Math.round((current / threshold) * 100));
  const unit = campaignType === 'visit_based' ? 'visit' : 'point';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center bg-brand-bg">
      <div className="w-full max-w-[430px] space-y-5 animate-slide-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: `${merchantColor}18` }}>
          <CheckCircle2 size={36} style={{ color: merchantColor }} />
        </div>
        <div>
          <h2 className="font-jakarta font-bold text-xl text-text-dark">Already Recorded!</h2>
          <p className="text-text-medium text-sm mt-1.5">
            Points already recorded for this visit to <strong>{merchantName}</strong>. See you next time! 👋
          </p>
        </div>
        <div className="bg-white rounded-xl border border-brand-border shadow-card p-5 space-y-3">
          <div className="flex justify-between text-xs font-medium text-text-medium">
            <span>Current progress</span>
            <span style={{ color: merchantColor }}>{current} / {threshold} {unit}s</span>
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
