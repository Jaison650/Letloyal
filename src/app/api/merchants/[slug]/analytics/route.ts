import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getMerchantBySlug } from '@/lib/merchants';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth) || auth.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await getMerchantBySlug(slug);
    if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [rescanRate, dailyScans, statusBreakdown, dailyEnrollments, campaignStats] = await Promise.all([
      // Re-scan rate: customers who visited more than once / total
      queryOne<{ rate: string }>(
        `SELECT ROUND(
           100.0 * SUM(CASE WHEN visit_count > 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)
         ) as rate
         FROM enrollments WHERE merchant_id = ?`,
        [merchant.id]
      ),

      // Daily scans last 30 days
      query<{ date: string; scans: string }>(
        `SELECT DATE(created_at) as date, COUNT(*) as scans
         FROM point_transactions
         WHERE merchant_id = ? AND transaction_type = 'earn'
           AND created_at >= NOW() - INTERVAL 30 DAY
         GROUP BY DATE(created_at) ORDER BY date`,
        [merchant.id]
      ),

      // Customer status breakdown
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) as count FROM enrollments WHERE merchant_id = ? GROUP BY status`,
        [merchant.id]
      ),

      // Daily enrollment counts (cumulative computed in JS)
      query<{ date: string; cnt: string }>(
        `SELECT DATE(enrolled_at) as date, COUNT(*) as cnt
         FROM enrollments WHERE merchant_id = ?
         GROUP BY DATE(enrolled_at)
         ORDER BY date`,
        [merchant.id]
      ),

      // Per-campaign stats
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

    // Compute cumulative enrollment growth in JS (avoids MySQL window fn compatibility issues)
    let running = 0;
    const enrollmentGrowth = dailyEnrollments.map((row) => {
      running += parseInt(row.cnt);
      return { date: row.date, total: String(running) };
    });

    return NextResponse.json({
      rescan_rate: parseInt(rescanRate?.rate || '0'),
      daily_scans: dailyScans,
      status_breakdown: statusBreakdown,
      enrollment_growth: enrollmentGrowth,
      campaign_stats: campaignStats,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 });
  }
}
