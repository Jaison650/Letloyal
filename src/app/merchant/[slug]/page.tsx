import { notFound, redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug, getActiveCampaigns } from '@/lib/merchants';
import { query, queryOne } from '@/lib/db';
import { generateVisitQR } from '@/lib/qr';
import DashboardShell from '@/components/merchant/DashboardShell';
import StatsBar from '@/components/merchant/StatsBar';
import QRPanel from '@/components/merchant/QRPanel';
import TransactionFeed from '@/components/merchant/TransactionFeed';
import ValidatorFAB from '@/components/merchant/ValidatorFAB';
import InsightsPanel from '@/components/merchant/InsightsPanel';
import CampaignRulesCard from '@/components/merchant/CampaignRulesCard';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { Trophy, Gift } from 'lucide-react';
import Link from 'next/link';

export default async function MerchantDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  const campaigns = await getActiveCampaigns(merchant.id);
  const primaryCampaign = campaigns[0];

  const [todayScans, activeCustomers, pointsToday, weekRedemptions, recentTxns, nearReward] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM point_transactions
       WHERE merchant_id = ? AND transaction_type = 'earn' AND created_at >= CURDATE()`,
      [merchant.id]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM enrollments
       WHERE merchant_id = ? AND status IN ('active','reward_unlocked')`,
      [merchant.id]
    ),
    queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(points), 0) as total FROM point_transactions
       WHERE merchant_id = ? AND transaction_type = 'earn' AND created_at >= CURDATE()`,
      [merchant.id]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM redemptions
       WHERE merchant_id = ? AND status = 'validated'
         AND validated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [merchant.id]
    ),
    query<{ customer_name: string; masked_phone: string; timestamp: string; type: string; points: number; campaign: string }>(
      `SELECT
         COALESCE(c.first_name, 'Customer') as customer_name,
         CONCAT(SUBSTRING(c.phone_number, 1, 4), ' *** *** **', RIGHT(c.phone_number, 2)) as masked_phone,
         pt.created_at as timestamp,
         pt.transaction_type as type,
         pt.points,
         cam.name as campaign
       FROM point_transactions pt
       JOIN customers c   ON c.id   = pt.customer_id
       JOIN campaigns cam ON cam.id = pt.campaign_id
       WHERE pt.merchant_id = ?
       ORDER BY pt.created_at DESC LIMIT 15`,
      [merchant.id]
    ),
    query<{ name: string; progress_pct: number; current: number; threshold: number; status: string }>(
      `SELECT
         COALESCE(cu.first_name, 'Customer') as name,
         ROUND(
           CASE cam.campaign_type
             WHEN 'visit_based' THEN (e.visit_count    / NULLIF(cam.reward_threshold, 0)) * 100
             ELSE                    (e.points_balance / NULLIF(cam.reward_threshold, 0)) * 100
           END
         ) as progress_pct,
         CASE cam.campaign_type
           WHEN 'visit_based' THEN e.visit_count
           ELSE e.points_balance
         END as current,
         cam.reward_threshold as threshold,
         e.status
       FROM enrollments e
       JOIN customers cu  ON cu.id  = e.customer_id
       JOIN campaigns cam ON cam.id = e.campaign_id
       WHERE e.merchant_id = ? AND e.status IN ('active','reward_unlocked')
       ORDER BY progress_pct DESC LIMIT 5`,
      [merchant.id]
    ),
  ]);

  let staticQrDataUrl = '';
  if (primaryCampaign) {
    staticQrDataUrl = await generateVisitQR(slug, primaryCampaign.id, merchant.brand_color);
  }

  return (
    <DashboardShell
      slug={slug}
      merchantName={merchant.business_name}
      planTier={merchant.plan_tier}
      logoSvg={merchant.logo_svg}
      brandColor={merchant.brand_color}
      qrDataUrl={staticQrDataUrl}
      campaignId={primaryCampaign?.id}
      rewardDescription={primaryCampaign?.reward_description}
      rewardThreshold={primaryCampaign?.reward_threshold}
      campaignType={primaryCampaign?.campaign_type as 'visit_based' | 'spend_based' | undefined}
    >
      {/* Stats bar */}
      <div className="mb-5 sm:mb-8">
        <StatsBar
          todayScans={parseInt(todayScans?.count || '0')}
          activeCustomers={parseInt(activeCustomers?.count || '0')}
          pointsIssuedToday={parseInt(pointsToday?.total || '0')}
          redemptionsThisWeek={parseInt(weekRedemptions?.count || '0')}
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">

        {/* Left column: QR first, then Insights, then Campaigns */}
        <div className="lg:col-span-1 space-y-6">

          {/* QR Panel — top of the column on all screen sizes */}
          {primaryCampaign && (
            <QRPanel
              merchantSlug={slug}
              merchantName={merchant.business_name}
              logoSvg={merchant.logo_svg}
              campaignType={primaryCampaign.campaign_type as 'visit_based' | 'spend_based'}
              campaignId={primaryCampaign.id}
              rewardDescription={primaryCampaign.reward_description}
              rewardThreshold={primaryCampaign.reward_threshold}
              brandColor={merchant.brand_color}
              staticQrDataUrl={staticQrDataUrl}
            />
          )}

          <InsightsPanel merchantSlug={slug} />

          {/* Campaigns — click to expand rules */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 gap-2 min-w-0">
              <h3 className="font-jakarta font-bold text-base sm:text-lg truncate">Campaigns</h3>
              <Link href={`/merchant/${slug}/campaigns`} className="shrink-0 text-xs text-primary font-semibold hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <p className="text-sm text-text-light text-center py-4">No active campaigns.</p>
              ) : campaigns.map((c) => (
                <CampaignRulesCard
                  key={c.id}
                  campaign={{
                    id: c.id,
                    name: c.name,
                    campaign_type: c.campaign_type,
                    participants_count: c.participants_count,
                    redemptions_count: c.redemptions_count,
                    reward_description: c.reward_description,
                    reward_threshold: c.reward_threshold,
                  }}
                  merchantSlug={slug}
                  brandColor={merchant.brand_color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Active campaign summary → Transactions → Near reward */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active campaign highlight */}
          {primaryCampaign && (
            <div
              className="rounded-2xl p-4 sm:p-5 text-white"
              style={{ background: `linear-gradient(135deg, #0F172A, ${merchant.brand_color})` }}
            >
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Running Campaign</p>
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <h3 className="font-jakarta font-bold text-base sm:text-lg leading-tight truncate">{primaryCampaign.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Gift size={13} className="text-white/70 shrink-0" />
                    <p className="text-xs sm:text-sm text-white/85 truncate">{primaryCampaign.reward_description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="text-xl font-jakarta font-bold">{primaryCampaign.participants_count}</p>
                  <p className="text-[9px] text-white/60 font-medium">members</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-white/70">
                <span>
                  {primaryCampaign.campaign_type === 'visit_based'
                    ? `${primaryCampaign.reward_threshold} visits to unlock`
                    : `€${primaryCampaign.reward_threshold} spend to unlock`}
                </span>
                <span>{primaryCampaign.redemptions_count} redeemed</span>
              </div>
            </div>
          )}

          <TransactionFeed merchantSlug={slug} initialTransactions={recentTxns} />

          {nearReward.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4 min-w-0">
                <Trophy size={16} className="text-accent shrink-0" />
                <h3 className="font-jakarta font-bold text-base sm:text-lg flex-1 min-w-0 truncate">Near Reward</h3>
                <Link
                  href={`/merchant/${slug}/customers?filter=near_reward`}
                  className="shrink-0 text-xs text-primary font-semibold hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {nearReward.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p
                          className="text-xs font-bold shrink-0"
                          style={{ color: c.status === 'reward_unlocked' ? '#5EEAD4' : '#0D9488' }}
                        >
                          {c.status === 'reward_unlocked'
                            ? '🎁 Ready!'
                            : `${Math.max(0, c.threshold - c.current)} left`}
                        </p>
                      </div>
                      <ProgressBar value={Math.min(100, c.progress_pct ?? 0)} height="sm" />
                      <p className="text-[10px] text-text-light mt-0.5">
                        {c.current} / {c.threshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating validate button */}
      <ValidatorFAB merchantSlug={slug} />
    </DashboardShell>
  );
}
