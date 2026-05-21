import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getMerchantBySlug } from '@/lib/merchants';
import type { MonthlyRow, DailyRow, CampaignRow, ReportKPIs, ReportMeta } from '@/types/report';

// Helper: format date as "2025-01"
function fmtMonth(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Helper: month label "Jan 2025"
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// Helper: day of week label
function dayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
}

// Helper: is weekend
function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

// Build last N months in "YYYY-MM" format
function lastNMonths(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    result.push(fmtMonth(d));
  }
  return result;
}

// Build last 30 days as "YYYY-MM-DD"
function last30Days(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth) || auth.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await getMerchantBySlug(slug);
    if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const merchantId = merchant.id;

    // ── A. Executive KPIs ──────────────────────────────────────────────────────

    const [activeCustomers, totalRedemptions, spendBasedCampaigns] = await Promise.all([
      queryOne<{ total: string }>(
        `SELECT COUNT(DISTINCT customer_id) as total
         FROM enrollments
         WHERE merchant_id = ? AND status IN ('active','reward_unlocked')`,
        [merchantId]
      ),
      queryOne<{ total: string }>(
        `SELECT COUNT(*) as total FROM redemptions
         WHERE merchant_id = ?
           AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`,
        [merchantId]
      ),
      query<{ id: string }>(
        `SELECT id FROM campaigns WHERE merchant_id = ? AND campaign_type = 'spend_based'`,
        [merchantId]
      ),
    ]);

    let avgSpendPerVisit = 0;
    if (spendBasedCampaigns.length > 0) {
      const campaignIds = spendBasedCampaigns.map((c) => c.id);
      const placeholders = campaignIds.map(() => '?').join(',');
      const spendRow = await queryOne<{ avg_pts: string }>(
        `SELECT AVG(points) as avg_pts
         FROM point_transactions
         WHERE merchant_id = ?
           AND transaction_type = 'earn'
           AND campaign_id IN (${placeholders})`,
        [merchantId, ...campaignIds]
      );
      avgSpendPerVisit = Math.round(((parseFloat(spendRow?.avg_pts || '0') / 100) + Number.EPSILON) * 100) / 100;
    }

    // ── B. Monthly data (last 6 months) ───────────────────────────────────────

    const months6 = lastNMonths(6);

    // Per-customer per-month earn transactions + first enrollment date
    const monthlyRaw = await query<{
      month: string;
      customer_id: string;
      first_ever_enrolled: string;
    }>(
      `SELECT
         DATE_FORMAT(pt.created_at, '%Y-%m') as month,
         pt.customer_id,
         MIN(e.enrolled_at) as first_ever_enrolled
       FROM point_transactions pt
       JOIN enrollments e ON e.customer_id = pt.customer_id AND e.merchant_id = pt.merchant_id
       WHERE pt.merchant_id = ?
         AND pt.transaction_type = 'earn'
         AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(pt.created_at, '%Y-%m'), pt.customer_id`,
      [merchantId]
    );

    // Monthly earn counts
    const monthlyVisits = await query<{ month: string; total_visits: string }>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total_visits
       FROM point_transactions
       WHERE merchant_id = ?
         AND transaction_type = 'earn'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
      [merchantId]
    );

    // Monthly spend (spend_based only)
    let monthlySpend: { month: string; total_spend: string }[] = [];
    if (spendBasedCampaigns.length > 0) {
      const campaignIds = spendBasedCampaigns.map((c) => c.id);
      const placeholders = campaignIds.map(() => '?').join(',');
      monthlySpend = await query<{ month: string; total_spend: string }>(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(points) as total_spend
         FROM point_transactions
         WHERE merchant_id = ?
           AND transaction_type = 'earn'
           AND campaign_id IN (${placeholders})
           AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
        [merchantId, ...campaignIds]
      );
    }

    // Monthly redemptions
    const monthlyRedemptions = await query<{ month: string; cnt: string }>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as cnt
       FROM redemptions
       WHERE merchant_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
      [merchantId]
    );

    // Aggregate monthly data in JS
    const monthlyVisitsMap: Record<string, number> = {};
    for (const r of monthlyVisits) monthlyVisitsMap[String(r.month)] = parseInt(r.total_visits) || 0;

    const monthlySpendMap: Record<string, number> = {};
    for (const r of monthlySpend) monthlySpendMap[String(r.month)] = parseInt(r.total_spend) || 0;

    const monthlyRedemptionsMap: Record<string, number> = {};
    for (const r of monthlyRedemptions) monthlyRedemptionsMap[String(r.month)] = parseInt(r.cnt) || 0;

    // Build new/returning per month
    const newPerMonth: Record<string, number> = {};
    const returningPerMonth: Record<string, number> = {};
    for (const row of monthlyRaw) {
      const m = String(row.month);
      const firstMonth = row.first_ever_enrolled
        ? String(row.first_ever_enrolled).slice(0, 7)
        : m;
      if (firstMonth === m) {
        newPerMonth[m] = (newPerMonth[m] || 0) + 1;
      } else {
        returningPerMonth[m] = (returningPerMonth[m] || 0) + 1;
      }
    }

    const monthlyRows: MonthlyRow[] = [];
    let prevReturning = 0;
    for (const m of months6) {
      const newC = newPerMonth[m] || 0;
      const retC = returningPerMonth[m] || 0;
      const total = newC + retC;
      const retRate = total > 0 ? Math.round((retC / total) * 10000) / 100 : 0;
      const totalVisits = monthlyVisitsMap[m] || 0;
      const totalSpendCents = monthlySpendMap[m] || 0;
      const totalSpendEur = Math.round((totalSpendCents / 100) * 100) / 100;
      const avgSpend = totalVisits > 0 ? Math.round((totalSpendEur / totalVisits) * 100) / 100 : 0;
      const redemptions = monthlyRedemptionsMap[m] || 0;
      const churnCount = Math.max(0, prevReturning - retC);
      const churnRate = prevReturning > 0 ? Math.round((churnCount / prevReturning) * 10000) / 100 : 0;
      prevReturning = retC;

      monthlyRows.push({
        month: m,
        month_label: monthLabel(m),
        new_customers: newC,
        returning_customers: retC,
        retention_rate: retRate,
        total_visits: totalVisits,
        total_spend_eur: totalSpendEur,
        avg_spend_per_visit: avgSpend,
        redemptions,
        churn_count: churnCount,
        churn_rate: churnRate,
      });
    }

    // Avg retention rate for KPI
    const validRetentionMonths = monthlyRows.filter((r) => r.new_customers + r.returning_customers > 0);
    const avgRetentionRate =
      validRetentionMonths.length > 0
        ? Math.round(
            (validRetentionMonths.reduce((s, r) => s + r.retention_rate, 0) /
              validRetentionMonths.length) *
              100
          ) / 100
        : 0;

    const kpis: ReportKPIs = {
      total_active_customers: parseInt(activeCustomers?.total || '0'),
      total_redemptions: parseInt(totalRedemptions?.total || '0'),
      avg_spend_per_visit: avgSpendPerVisit,
      avg_retention_rate: avgRetentionRate,
    };

    // ── C. Daily data (last 30 days) ──────────────────────────────────────────

    const days30 = last30Days();

    const dailyRaw = await query<{
      date: string;
      customer_id: string;
      first_ever_enrolled: string;
    }>(
      `SELECT
         DATE(pt.created_at) as date,
         pt.customer_id,
         MIN(e.enrolled_at) as first_ever_enrolled
       FROM point_transactions pt
       JOIN enrollments e ON e.customer_id = pt.customer_id AND e.merchant_id = pt.merchant_id
       WHERE pt.merchant_id = ?
         AND pt.transaction_type = 'earn'
         AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(pt.created_at), pt.customer_id`,
      [merchantId]
    );

    const dailyVisitsRaw = await query<{ date: string; total_visits: string }>(
      `SELECT DATE(created_at) as date, COUNT(*) as total_visits
       FROM point_transactions
       WHERE merchant_id = ?
         AND transaction_type = 'earn'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)`,
      [merchantId]
    );

    let dailySpend: { date: string; total_spend: string }[] = [];
    if (spendBasedCampaigns.length > 0) {
      const campaignIds = spendBasedCampaigns.map((c) => c.id);
      const placeholders = campaignIds.map(() => '?').join(',');
      dailySpend = await query<{ date: string; total_spend: string }>(
        `SELECT DATE(created_at) as date, SUM(points) as total_spend
         FROM point_transactions
         WHERE merchant_id = ?
           AND transaction_type = 'earn'
           AND campaign_id IN (${placeholders})
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY DATE(created_at)`,
        [merchantId, ...campaignIds]
      );
    }

    const dailyRedemptions = await query<{ date: string; cnt: string }>(
      `SELECT DATE(created_at) as date, COUNT(*) as cnt
       FROM redemptions
       WHERE merchant_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)`,
      [merchantId]
    );

    const dailyVisitsMap: Record<string, number> = {};
    for (const r of dailyVisitsRaw) dailyVisitsMap[String(r.date).slice(0, 10)] = parseInt(r.total_visits) || 0;

    const dailySpendMap: Record<string, number> = {};
    for (const r of dailySpend) dailySpendMap[String(r.date).slice(0, 10)] = parseInt(r.total_spend) || 0;

    const dailyRedemptionsMap: Record<string, number> = {};
    for (const r of dailyRedemptions) dailyRedemptionsMap[String(r.date).slice(0, 10)] = parseInt(r.cnt) || 0;

    const dailyNewMap: Record<string, number> = {};
    const dailyRetMap: Record<string, number> = {};
    for (const row of dailyRaw) {
      const d = String(row.date).slice(0, 10);
      const firstDate = row.first_ever_enrolled ? String(row.first_ever_enrolled).slice(0, 10) : d;
      if (firstDate === d) {
        dailyNewMap[d] = (dailyNewMap[d] || 0) + 1;
      } else {
        dailyRetMap[d] = (dailyRetMap[d] || 0) + 1;
      }
    }

    const dailyRows: DailyRow[] = days30.map((d) => {
      const newC = dailyNewMap[d] || 0;
      const retC = dailyRetMap[d] || 0;
      const total = newC + retC;
      const retRate = total > 0 ? Math.round((retC / total) * 10000) / 100 : 0;
      const spendCents = dailySpendMap[d] || 0;
      const spendEur = Math.round((spendCents / 100) * 100) / 100;
      return {
        date: d,
        day_of_week: dayOfWeek(d),
        total_visits: dailyVisitsMap[d] || 0,
        new_customers: newC,
        returning_customers: retC,
        total_spend_eur: spendEur,
        redemptions: dailyRedemptionsMap[d] || 0,
        retention_rate: retRate,
        is_weekend: isWeekend(d),
      };
    });

    // ── D. Campaign performance ────────────────────────────────────────────────

    const campaignRows = await query<{
      id: string;
      name: string;
      campaign_type: string;
      reward_description: string;
      start_date: string;
      status: string;
      reward_threshold: number;
      points_per_euro: number | null;
      enrolled: string;
      redeemed: string;
      total_points_issued: string;
    }>(
      `SELECT
         c.id, c.name, c.campaign_type, c.reward_description, c.start_date, c.status,
         c.reward_threshold, c.points_per_euro,
         COUNT(DISTINCT e.customer_id) as enrolled,
         COUNT(DISTINCT r.id) as redeemed,
         COALESCE(SUM(pt.points), 0) as total_points_issued
       FROM campaigns c
       LEFT JOIN enrollments e ON e.campaign_id = c.id
       LEFT JOIN redemptions r ON r.campaign_id = c.id AND r.status = 'validated'
       LEFT JOIN point_transactions pt ON pt.campaign_id = c.id AND pt.transaction_type = 'earn'
       WHERE c.merchant_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [merchantId]
    );

    const campaigns: CampaignRow[] = campaignRows.map((c) => {
      const enrolled = parseInt(c.enrolled) || 0;
      const redeemed = parseInt(c.redeemed) || 0;
      const pointsIssued = parseInt(c.total_points_issued) || 0;
      const completionRate =
        enrolled > 0 ? Math.round((redeemed / enrolled) * 10000) / 100 : 0;
      const estValue =
        c.campaign_type === 'spend_based'
          ? Math.round((redeemed * (c.reward_threshold || 0)) / 100 * 100) / 100
          : redeemed;

      return {
        id: c.id,
        name: c.name,
        campaign_type: c.campaign_type,
        reward_description: c.reward_description,
        start_date: c.start_date ? String(c.start_date).slice(0, 10) : '',
        status: c.status,
        enrolled,
        redeemed,
        completion_rate: completionRate,
        points_issued: pointsIssued,
        est_value_eur: estValue,
      };
    });

    // ── Meta ──────────────────────────────────────────────────────────────────

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const meta: ReportMeta = {
      merchant_name: merchant.business_name,
      generated_at: now.toISOString(),
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: now.toISOString().slice(0, 10),
    };

    return NextResponse.json({ kpis, monthly: monthlyRows, daily: dailyRows, campaigns, meta });
  } catch (err) {
    console.error('Report error:', err);
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }
}
