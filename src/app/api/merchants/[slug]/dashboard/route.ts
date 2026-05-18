import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getMerchantBySlug, getActiveCampaigns } from '@/lib/merchants';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth) || auth.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await getMerchantBySlug(slug);
    if (!merchant) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });

    const [todayScans, activeCustomers, pointsToday, weekRedemptions, recentTxns, nearReward, campaigns] = await Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM point_transactions
         WHERE merchant_id = ? AND transaction_type = 'earn' AND created_at >= CURDATE()`,
        [merchant.id]
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM enrollments WHERE merchant_id = ? AND status IN ('active','reward_unlocked')`,
        [merchant.id]
      ),
      queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(points), 0) as total FROM point_transactions
         WHERE merchant_id = ? AND transaction_type = 'earn' AND created_at >= CURDATE()`,
        [merchant.id]
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM redemptions
         WHERE merchant_id = ? AND status = 'validated' AND validated_at >= NOW() - INTERVAL 7 DAY`,
        [merchant.id]
      ),
      query<{
        customer_name: string;
        masked_phone: string;
        timestamp: string;
        type: string;
        points: number;
        campaign: string;
      }>(
        `SELECT
           COALESCE(c.first_name, 'Customer') as customer_name,
           CONCAT(SUBSTRING(c.phone_number, 1, 4), ' *** *** **', RIGHT(c.phone_number, 2)) as masked_phone,
           pt.created_at as timestamp,
           pt.transaction_type as type,
           pt.points,
           cam.name as campaign
         FROM point_transactions pt
         JOIN customers c ON c.id = pt.customer_id
         JOIN campaigns cam ON cam.id = pt.campaign_id
         WHERE pt.merchant_id = ?
         ORDER BY pt.created_at DESC LIMIT 15`,
        [merchant.id]
      ),
      query<{
        name: string;
        progress_pct: number;
        current: number;
        threshold: number;
        status: string;
      }>(
        `SELECT
           COALESCE(cu.first_name, 'Customer') as name,
           ROUND(
             CASE cam.campaign_type
               WHEN 'visit_based' THEN (e.visit_count / NULLIF(cam.reward_threshold, 0)) * 100
               ELSE (e.points_balance / NULLIF(cam.reward_threshold, 0)) * 100
             END
           ) as progress_pct,
           CASE cam.campaign_type
             WHEN 'visit_based' THEN e.visit_count
             ELSE e.points_balance
           END as current,
           cam.reward_threshold as threshold,
           e.status
         FROM enrollments e
         JOIN customers cu ON cu.id = e.customer_id
         JOIN campaigns cam ON cam.id = e.campaign_id
         WHERE e.merchant_id = ? AND e.status IN ('active','reward_unlocked')
         ORDER BY progress_pct DESC LIMIT 5`,
        [merchant.id]
      ),
      getActiveCampaigns(merchant.id),
    ]);

    return NextResponse.json({
      today_scans: parseInt(todayScans?.count || '0'),
      active_customers: parseInt(activeCustomers?.count || '0'),
      points_issued_today: parseInt(pointsToday?.total || '0'),
      redemptions_this_week: parseInt(weekRedemptions?.count || '0'),
      recent_transactions: recentTxns,
      customers_near_reward: nearReward,
      active_campaigns: campaigns,
      merchant: {
        id: merchant.id,
        slug: merchant.slug,
        business_name: merchant.business_name,
        category: merchant.category,
        brand_color: merchant.brand_color,
        logo_svg: merchant.logo_svg,
        plan_tier: merchant.plan_tier,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard.' }, { status: 500 });
  }
}
