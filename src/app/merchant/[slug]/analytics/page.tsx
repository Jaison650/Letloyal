import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import { query, queryOne } from '@/lib/db';
import DashboardShell from '@/components/merchant/DashboardShell';
import AnalyticsChartsClient from '@/components/merchant/AnalyticsChartsClient';

const AnalyticsCharts = AnalyticsChartsClient;

export default async function AnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) redirect('/merchant/login');

  const [rescanRate, dailyScans, statusBreakdown, dailyEnrollments, campaignStats] = await Promise.all([
    queryOne<{ rate: string }>(
      `SELECT ROUND(
         100.0 * SUM(CASE WHEN visit_count > 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)
       ) as rate FROM enrollments WHERE merchant_id = ?`,
      [merchant.id]
    ),
    query<{ date: string; scans: string }>(
      `SELECT DATE(created_at) as date, COUNT(*) as scans
       FROM point_transactions
       WHERE merchant_id = ? AND transaction_type = 'earn'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) ORDER BY date`,
      [merchant.id]
    ),
    query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM enrollments WHERE merchant_id = ? GROUP BY status`,
      [merchant.id]
    ),
    query<{ date: string; cnt: string }>(
      `SELECT DATE(enrolled_at) as date, COUNT(*) as cnt
       FROM enrollments WHERE merchant_id = ?
       GROUP BY DATE(enrolled_at) ORDER BY date`,
      [merchant.id]
    ),
    query<{
      name: string;
      campaign_type: string;
      status: string;
      participants_count: number;
      redemptions_count: number;
      avg_visits: string;
    }>(
      `SELECT c.name, c.campaign_type, c.status, c.participants_count, c.redemptions_count,
              ROUND(AVG(e.visit_count), 1) as avg_visits
       FROM campaigns c
       LEFT JOIN enrollments e ON e.campaign_id = c.id
       WHERE c.merchant_id = ?
       GROUP BY c.id, c.name, c.campaign_type, c.status, c.participants_count, c.redemptions_count
       ORDER BY c.created_at DESC`,
      [merchant.id]
    ),
  ]);

  // Compute cumulative enrollment growth in JS
  let running = 0;
  const enrollmentGrowth = dailyEnrollments.map((row) => {
    running += parseInt(row.cnt);
    return { date: String(row.date), total: running };
  });

  return (
    <DashboardShell
      slug={slug}
      merchantName={merchant.business_name}
      planTier={merchant.plan_tier}
      logoSvg={merchant.logo_svg}
      brandColor={merchant.brand_color}
    >
      <div className="mb-8">
        <h1 className="font-jakarta font-bold text-2xl lg:text-3xl">Analytics</h1>
        <p className="text-text-medium mt-1">Performance overview for your loyalty program.</p>
      </div>

      <AnalyticsCharts
        rescanRate={parseInt(rescanRate?.rate || '0')}
        dailyScans={dailyScans.map(d => ({ date: String(d.date), scans: parseInt(d.scans) }))}
        statusBreakdown={statusBreakdown.map(s => ({ status: s.status, count: parseInt(s.count) }))}
        enrollmentGrowth={enrollmentGrowth}
        campaignStats={campaignStats.map(c => ({ ...c, avg_visits: parseFloat(c.avg_visits) || 0 }))}
        brandColor={merchant.brand_color}
      />
    </DashboardShell>
  );
}
