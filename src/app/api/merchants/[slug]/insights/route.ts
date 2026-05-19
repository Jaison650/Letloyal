import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [nearReward, inactive, weekComparison, topCustomers, rewardReady] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM enrollments e
       JOIN campaigns c ON c.id = e.campaign_id
       WHERE e.merchant_id = ? AND e.status = 'active'
         AND (
           CASE c.campaign_type
             WHEN 'visit_based' THEN e.visit_count / c.reward_threshold
             ELSE e.points_balance / c.reward_threshold
           END
         ) >= 0.8`,
      [merchant.id]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM enrollments
       WHERE merchant_id = ? AND status = 'active'
         AND last_activity_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [merchant.id]
    ),
    Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM point_transactions
         WHERE merchant_id = ? AND transaction_type = 'earn'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [merchant.id]
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM point_transactions
         WHERE merchant_id = ? AND transaction_type = 'earn'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
           AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
        [merchant.id]
      ),
    ]),
    query<{ name: string; visit_count: number; cycle_number: number }>(
      `SELECT COALESCE(cu.first_name, 'Customer') as name,
              e.visit_count, e.cycle_number
       FROM enrollments e
       JOIN customers cu ON cu.id = e.customer_id
       WHERE e.merchant_id = ? AND e.status IN ('active','reward_unlocked')
       ORDER BY e.cycle_number DESC, e.visit_count DESC LIMIT 3`,
      [merchant.id]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM enrollments
       WHERE merchant_id = ? AND status = 'reward_unlocked'`,
      [merchant.id]
    ),
  ]);

  const [thisWeek, lastWeek] = weekComparison;
  const thisWeekCount = parseInt(thisWeek?.count || '0');
  const lastWeekCount = parseInt(lastWeek?.count || '0');
  const visitTrend = lastWeekCount > 0
    ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
    : thisWeekCount > 0 ? 100 : 0;

  const insights: Array<{ type: string; icon: string; title: string; message: string; priority: 'high' | 'medium' | 'low' }> = [];

  const nearCount = parseInt(nearReward?.count || '0');
  if (nearCount > 0) {
    insights.push({
      type: 'near_reward',
      icon: '🎯',
      title: 'Customers Close to Reward',
      message: `${nearCount} customer${nearCount !== 1 ? 's are' : ' is'} 80%+ of the way to unlocking their reward. Send them an encouraging message!`,
      priority: 'high',
    });
  }

  const readyCount = parseInt(rewardReady?.count || '0');
  if (readyCount > 0) {
    insights.push({
      type: 'reward_ready',
      icon: '🎁',
      title: 'Rewards Waiting to be Redeemed',
      message: `${readyCount} customer${readyCount !== 1 ? 's have' : ' has'} unlocked a reward but not yet redeemed it. Consider sending a reminder.`,
      priority: 'high',
    });
  }

  const inactiveCount = parseInt(inactive?.count || '0');
  if (inactiveCount > 0) {
    insights.push({
      type: 'inactive',
      icon: '😴',
      title: 'Inactive Loyal Customers',
      message: `${inactiveCount} customer${inactiveCount !== 1 ? 's haven\'t' : ' hasn\'t'} visited in 30+ days. A re-engagement campaign could bring them back.`,
      priority: 'medium',
    });
  }

  if (visitTrend > 0) {
    insights.push({
      type: 'trend_up',
      icon: '📈',
      title: 'Visits Up This Week',
      message: `Visits increased ${visitTrend}% vs last week (${thisWeekCount} vs ${lastWeekCount}). Great momentum!`,
      priority: 'low',
    });
  } else if (visitTrend < -10) {
    insights.push({
      type: 'trend_down',
      icon: '📉',
      title: 'Visits Down This Week',
      message: `Visits dropped ${Math.abs(visitTrend)}% vs last week. Consider running a promotion to boost engagement.`,
      priority: 'medium',
    });
  }

  if (topCustomers.length > 0) {
    const names = topCustomers.map(c => c.name).join(', ');
    insights.push({
      type: 'top_customers',
      icon: '🏆',
      title: 'Top Returning Customers',
      message: `Your most loyal customers this month: ${names}. Consider sending them a special thank-you reward.`,
      priority: 'low',
    });
  }

  return NextResponse.json({ insights, meta: { nearReward: nearCount, inactive: inactiveCount, rewardReady: readyCount, visitTrend } });
}
