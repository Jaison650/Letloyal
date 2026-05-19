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
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { Target, Trophy } from 'lucide-react';
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
    >
      {/* Stats bar */}
      <div className="mb-8">
        <StatsBar
          todayScans={parseInt(todayScans?.count || '0')}
          activeCustomers={parseInt(activeCustomers?.count || '0')}
          pointsIssuedToday={parseInt(pointsToday?.total || '0')}
          redemptionsThisWeek={parseInt(weekRedemptions?.count || '0')}
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column: QR + Active Campaigns */}
        <div className="lg:col-span-1 space-y-6">
          <InsightsPanel merchantSlug={slug} />

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

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sora font-bold text-lg">Campaigns</h3>
              <Link href={`/merchant/${slug}/campaigns`} className="text-xs text-primary font-semibold hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <p className="text-sm text-text-light text-center py-4">No active campaigns.</p>
              ) : campaigns.map((c) => (
                <div key={c.id} className="bg-brand-bg rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={c.campaign_type === 'visit_based' ? 'visit' : 'spend'}>
                        <Target size={10} /> {c.campaign_type === 'visit_based' ? 'Visits' : 'Spend'}
                      </Badge>
                      <Badge variant="active">Active</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-medium">
                    <span>{c.participants_count} participants</span>
                    <span>{c.redemptions_count} redeemed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Transaction feed + Near reward */}
        <div className="lg:col-span-2 space-y-6">
          <TransactionFeed merchantSlug={slug} initialTransactions={recentTxns} />

          {nearReward.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-accent" />
                  <h3 className="font-sora font-bold text-lg">Customers Near Their Reward</h3>
                </div>
                <Link
                  href={`/merchant/${slug}/customers?filter=near_reward`}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  View All Customers →
                </Link>
              </div>
              <div className="space-y-3">
                {nearReward.map((c, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{c.name}</p>
                        <p
                          className="text-xs font-bold"
                          style={{ color: c.status === 'reward_unlocked' ? '#02C39A' : '#028090' }}
                        >
                          {c.status === 'reward_unlocked'
                            ? '🎁 Ready!'
                            : `${Math.max(0, c.threshold - c.current)} away from reward`}
                        </p>
                      </div>
                      <ProgressBar value={Math.min(100, c.progress_pct ?? 0)} height="sm" />
                      <p className="text-xs text-text-light mt-1">
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
