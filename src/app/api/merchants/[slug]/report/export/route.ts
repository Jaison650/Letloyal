import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import ExcelJS from 'exceljs';
import type { ReportData, MonthlyRow, DailyRow, CampaignRow } from '@/types/report';

// Fetch report data directly (reuse logic inline to avoid circular imports)
import { query, queryOne } from '@/lib/db';

async function fetchReportData(merchantId: string, merchantName: string): Promise<ReportData> {
  // Spend-based campaigns
  const spendBasedCampaigns = await query<{ id: string }>(
    `SELECT id FROM campaigns WHERE merchant_id = ? AND campaign_type = 'spend_based'`,
    [merchantId]
  );

  const [activeCustomers, totalRedemptions] = await Promise.all([
    queryOne<{ total: string }>(
      `SELECT COUNT(DISTINCT customer_id) as total FROM enrollments WHERE merchant_id = ? AND status IN ('active','reward_unlocked')`,
      [merchantId]
    ),
    queryOne<{ total: string }>(
      `SELECT COUNT(*) as total FROM redemptions WHERE merchant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`,
      [merchantId]
    ),
  ]);

  let avgSpendPerVisit = 0;
  if (spendBasedCampaigns.length > 0) {
    const ids = spendBasedCampaigns.map((c) => c.id);
    const ph = ids.map(() => '?').join(',');
    const sr = await queryOne<{ avg_pts: string }>(
      `SELECT AVG(points) as avg_pts FROM point_transactions WHERE merchant_id = ? AND transaction_type = 'earn' AND campaign_id IN (${ph})`,
      [merchantId, ...ids]
    );
    avgSpendPerVisit = Math.round(((parseFloat(sr?.avg_pts || '0') / 100) + Number.EPSILON) * 100) / 100;
  }

  // Monthly data helpers
  function fmtMonth(d: Date) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }
  function monthLabel(ym: string) { const [y, m] = ym.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }); }
  const now = new Date();
  const months6: string[] = [];
  for (let i = 5; i >= 0; i--) { months6.push(fmtMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)))); }
  const days30: string[] = [];
  for (let i = 29; i >= 0; i--) { days30.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)).toISOString().slice(0, 10)); }

  const [monthlyRaw, monthlyVisits, monthlyRedemptionRows, dailyRaw, dailyVisitsRaw, dailyRedemptions] = await Promise.all([
    query<{ month: string; customer_id: string; first_ever_enrolled: string }>(
      `SELECT DATE_FORMAT(pt.created_at, '%Y-%m') as month, pt.customer_id, MIN(e.enrolled_at) as first_ever_enrolled
       FROM point_transactions pt JOIN enrollments e ON e.customer_id = pt.customer_id AND e.merchant_id = pt.merchant_id
       WHERE pt.merchant_id = ? AND pt.transaction_type = 'earn' AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(pt.created_at, '%Y-%m'), pt.customer_id`,
      [merchantId]
    ),
    query<{ month: string; total_visits: string }>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total_visits FROM point_transactions WHERE merchant_id = ? AND transaction_type = 'earn' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
      [merchantId]
    ),
    query<{ month: string; cnt: string }>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as cnt FROM redemptions WHERE merchant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
      [merchantId]
    ),
    query<{ date: string; customer_id: string; first_ever_enrolled: string }>(
      `SELECT DATE(pt.created_at) as date, pt.customer_id, MIN(e.enrolled_at) as first_ever_enrolled
       FROM point_transactions pt JOIN enrollments e ON e.customer_id = pt.customer_id AND e.merchant_id = pt.merchant_id
       WHERE pt.merchant_id = ? AND pt.transaction_type = 'earn' AND pt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(pt.created_at), pt.customer_id`,
      [merchantId]
    ),
    query<{ date: string; total_visits: string }>(
      `SELECT DATE(created_at) as date, COUNT(*) as total_visits FROM point_transactions WHERE merchant_id = ? AND transaction_type = 'earn' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at)`,
      [merchantId]
    ),
    query<{ date: string; cnt: string }>(
      `SELECT DATE(created_at) as date, COUNT(*) as cnt FROM redemptions WHERE merchant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at)`,
      [merchantId]
    ),
  ]);

  let monthlySpend: { month: string; total_spend: string }[] = [];
  let dailySpend: { date: string; total_spend: string }[] = [];
  if (spendBasedCampaigns.length > 0) {
    const ids = spendBasedCampaigns.map((c) => c.id);
    const ph = ids.map(() => '?').join(',');
    [monthlySpend, dailySpend] = await Promise.all([
      query<{ month: string; total_spend: string }>(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(points) as total_spend FROM point_transactions WHERE merchant_id = ? AND transaction_type = 'earn' AND campaign_id IN (${ph}) AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
        [merchantId, ...ids]
      ),
      query<{ date: string; total_spend: string }>(
        `SELECT DATE(created_at) as date, SUM(points) as total_spend FROM point_transactions WHERE merchant_id = ? AND transaction_type = 'earn' AND campaign_id IN (${ph}) AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(created_at)`,
        [merchantId, ...ids]
      ),
    ]);
  }

  const mVisitsMap: Record<string, number> = {};
  for (const r of monthlyVisits) mVisitsMap[String(r.month)] = parseInt(r.total_visits) || 0;
  const mSpendMap: Record<string, number> = {};
  for (const r of monthlySpend) mSpendMap[String(r.month)] = parseInt(r.total_spend) || 0;
  const mRedMap: Record<string, number> = {};
  for (const r of monthlyRedemptionRows) mRedMap[String(r.month)] = parseInt(r.cnt) || 0;
  const mNewMap: Record<string, number> = {};
  const mRetMap: Record<string, number> = {};
  for (const row of monthlyRaw) {
    const m = String(row.month);
    const first = row.first_ever_enrolled ? String(row.first_ever_enrolled).slice(0, 7) : m;
    if (first === m) mNewMap[m] = (mNewMap[m] || 0) + 1;
    else mRetMap[m] = (mRetMap[m] || 0) + 1;
  }

  const monthly: MonthlyRow[] = [];
  let prevRet = 0;
  for (const m of months6) {
    const newC = mNewMap[m] || 0;
    const retC = mRetMap[m] || 0;
    const total = newC + retC;
    const retRate = total > 0 ? Math.round((retC / total) * 10000) / 100 : 0;
    const vis = mVisitsMap[m] || 0;
    const spendEur = Math.round((mSpendMap[m] || 0) / 100 * 100) / 100;
    const avgSpend = vis > 0 ? Math.round((spendEur / vis) * 100) / 100 : 0;
    const churn = Math.max(0, prevRet - retC);
    const churnRate = prevRet > 0 ? Math.round((churn / prevRet) * 10000) / 100 : 0;
    prevRet = retC;
    monthly.push({ month: m, month_label: monthLabel(m), new_customers: newC, returning_customers: retC, retention_rate: retRate, total_visits: vis, total_spend_eur: spendEur, avg_spend_per_visit: avgSpend, redemptions: mRedMap[m] || 0, churn_count: churn, churn_rate: churnRate });
  }

  const validM = monthly.filter((r) => r.new_customers + r.returning_customers > 0);
  const avgRetentionRate = validM.length > 0 ? Math.round(validM.reduce((s, r) => s + r.retention_rate, 0) / validM.length * 100) / 100 : 0;

  const dVisitsMap: Record<string, number> = {};
  for (const r of dailyVisitsRaw) dVisitsMap[String(r.date).slice(0, 10)] = parseInt(r.total_visits) || 0;
  const dSpendMap: Record<string, number> = {};
  for (const r of dailySpend) dSpendMap[String(r.date).slice(0, 10)] = parseInt(r.total_spend) || 0;
  const dRedMap: Record<string, number> = {};
  for (const r of dailyRedemptions) dRedMap[String(r.date).slice(0, 10)] = parseInt(r.cnt) || 0;
  const dNewMap: Record<string, number> = {};
  const dRetMap: Record<string, number> = {};
  for (const row of dailyRaw) {
    const d = String(row.date).slice(0, 10);
    const first = row.first_ever_enrolled ? String(row.first_ever_enrolled).slice(0, 10) : d;
    if (first === d) dNewMap[d] = (dNewMap[d] || 0) + 1;
    else dRetMap[d] = (dRetMap[d] || 0) + 1;
  }

  const daily: DailyRow[] = days30.map((d) => {
    const newC = dNewMap[d] || 0;
    const retC = dRetMap[d] || 0;
    const total = newC + retC;
    const retRate = total > 0 ? Math.round((retC / total) * 10000) / 100 : 0;
    const spendEur = Math.round((dSpendMap[d] || 0) / 100 * 100) / 100;
    const dt = new Date(d + 'T00:00:00Z');
    const dayNum = dt.getUTCDay();
    return { date: d, day_of_week: dt.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' }), total_visits: dVisitsMap[d] || 0, new_customers: newC, returning_customers: retC, total_spend_eur: spendEur, redemptions: dRedMap[d] || 0, retention_rate: retRate, is_weekend: dayNum === 0 || dayNum === 6 };
  });

  const campaignRaw = await query<{ id: string; name: string; campaign_type: string; reward_description: string; start_date: string; status: string; reward_threshold: number; enrolled: string; redeemed: string; total_points_issued: string }>(
    `SELECT c.id, c.name, c.campaign_type, c.reward_description, c.start_date, c.status, c.reward_threshold, COUNT(DISTINCT e.customer_id) as enrolled, COUNT(DISTINCT r.id) as redeemed, COALESCE(SUM(pt.points), 0) as total_points_issued FROM campaigns c LEFT JOIN enrollments e ON e.campaign_id = c.id LEFT JOIN redemptions r ON r.campaign_id = c.id AND r.status = 'validated' LEFT JOIN point_transactions pt ON pt.campaign_id = c.id AND pt.transaction_type = 'earn' WHERE c.merchant_id = ? GROUP BY c.id ORDER BY c.created_at DESC`,
    [merchantId]
  );

  const campaigns: CampaignRow[] = campaignRaw.map((c) => {
    const enrolled = parseInt(c.enrolled) || 0;
    const redeemed = parseInt(c.redeemed) || 0;
    const pointsIssued = parseInt(c.total_points_issued) || 0;
    const completionRate = enrolled > 0 ? Math.round((redeemed / enrolled) * 10000) / 100 : 0;
    const estValue = c.campaign_type === 'spend_based' ? Math.round(redeemed * (c.reward_threshold || 0) / 100 * 100) / 100 : redeemed;
    return { id: c.id, name: c.name, campaign_type: c.campaign_type, reward_description: c.reward_description, start_date: c.start_date ? String(c.start_date).slice(0, 10) : '', status: c.status, enrolled, redeemed, completion_rate: completionRate, points_issued: pointsIssued, est_value_eur: estValue };
  });

  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  return {
    kpis: { total_active_customers: parseInt(activeCustomers?.total || '0'), total_redemptions: parseInt(totalRedemptions?.total || '0'), avg_spend_per_visit: avgSpendPerVisit, avg_retention_rate: avgRetentionRate },
    monthly,
    daily,
    campaigns,
    meta: { merchant_name: merchantName, generated_at: now.toISOString(), period_start: periodStart.toISOString().slice(0, 10), period_end: now.toISOString().slice(0, 10) },
  };
}

const TEAL = { argb: 'FF028090' } as ExcelJS.Color;
const MINT = { argb: 'FF02C39A' } as ExcelJS.Color;
const DARK = { argb: 'FF014451' } as ExcelJS.Color;
const WHITE = { argb: 'FFFFFFFF' } as ExcelJS.Color;
const TOTALS_BG = { argb: 'FFF0F9FF' } as ExcelJS.Color;

function headerStyle(ws: ExcelJS.Worksheet, row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: TEAL };
    cell.font = { color: WHITE, bold: true, size: 11, name: 'Arial' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
  });
  row.height = 22;
}

function subHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: MINT };
    cell.font = { color: DARK, bold: true, size: 10, name: 'Arial' };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 18;
}

function totalsRowStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: TOTALS_BG };
    cell.font = { bold: true, name: 'Arial', size: 10 };
    cell.border = { top: { style: 'double', color: { argb: 'FF028090' } } };
  });
}

function retentionCellStyle(cell: ExcelJS.Cell, value: number) {
  if (value >= 70) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
    cell.font = { color: { argb: 'FF276221' }, bold: true, name: 'Arial', size: 10 };
  } else if (value >= 60) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
    cell.font = { color: { argb: 'FF9C5700' }, bold: true, name: 'Arial', size: 10 };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
    cell.font = { color: { argb: 'FF9C0006' }, bold: true, name: 'Arial', size: 10 };
  }
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

    const format = req.nextUrl.searchParams.get('format');
    if (format !== 'xlsx') {
      return NextResponse.json({ error: 'Only format=xlsx is supported' }, { status: 400 });
    }

    const data = await fetchReportData(merchant.id, merchant.business_name);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LetLoyal';
    workbook.created = new Date();

    const colWidths = [15, 18, 18, 16, 12, 14, 14, 13, 13, 13];

    // ── Sheet 1: Executive Summary ────────────────────────────────────────────
    const ws1 = workbook.addWorksheet('Executive Summary');
    ws1.columns = [
      { width: 20 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 14 },
      { width: 14 }, { width: 14 }, { width: 13 }, { width: 13 }, { width: 13 },
    ];

    // KPI block
    const kpiTitleRow = ws1.addRow(['Executive KPIs', '', '', '']);
    ws1.mergeCells(`A${kpiTitleRow.number}:D${kpiTitleRow.number}`);
    headerStyle(ws1, kpiTitleRow);

    const kpiLabels = ws1.addRow(['Total Active Customers', 'Total Redemptions (6mo)', 'Avg Spend / Visit (€)', 'Avg Retention Rate (%)']);
    subHeaderStyle(kpiLabels);
    const kpiVals = ws1.addRow([
      data.kpis.total_active_customers,
      data.kpis.total_redemptions,
      data.kpis.avg_spend_per_visit,
      data.kpis.avg_retention_rate,
    ]);
    kpiVals.getCell(3).numFmt = '€#,##0.00';
    kpiVals.getCell(4).numFmt = '0.0"%"';
    kpiVals.height = 20;

    ws1.addRow([]);

    // Monthly performance table
    const mTitleRow = ws1.addRow(['Monthly Performance (Last 6 Months)']);
    ws1.mergeCells(`A${mTitleRow.number}:J${mTitleRow.number}`);
    headerStyle(ws1, mTitleRow);

    const mHeaderRow = ws1.addRow(['Month', 'New Customers', 'Returning Customers', 'Retention Rate %', 'Total Visits', 'Total Spend (€)', 'Avg Spend/Visit (€)', 'Redemptions', 'Churn Count', 'Churn Rate %']);
    subHeaderStyle(mHeaderRow);

    const mStartRow = ws1.lastRow!.number + 1;
    for (const row of data.monthly) {
      const r = ws1.addRow([row.month_label, row.new_customers, row.returning_customers, row.retention_rate / 100, row.total_visits, row.total_spend_eur, row.avg_spend_per_visit, row.redemptions, row.churn_count, row.churn_rate / 100]);
      r.getCell(4).numFmt = '0.0%';
      r.getCell(6).numFmt = '€#,##0.00';
      r.getCell(7).numFmt = '€#,##0.00';
      r.getCell(10).numFmt = '0.0%';
      retentionCellStyle(r.getCell(4), row.retention_rate);
      r.eachCell((c) => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
    }
    const mEndRow = ws1.lastRow!.number;

    const mTotals = ws1.addRow([
      'TOTALS / AVG',
      { formula: `SUM(B${mStartRow}:B${mEndRow})` },
      { formula: `SUM(C${mStartRow}:C${mEndRow})` },
      { formula: `AVERAGE(D${mStartRow}:D${mEndRow})` },
      { formula: `SUM(E${mStartRow}:E${mEndRow})` },
      { formula: `SUM(F${mStartRow}:F${mEndRow})` },
      { formula: `AVERAGE(G${mStartRow}:G${mEndRow})` },
      { formula: `SUM(H${mStartRow}:H${mEndRow})` },
      { formula: `SUM(I${mStartRow}:I${mEndRow})` },
      { formula: `AVERAGE(J${mStartRow}:J${mEndRow})` },
    ]);
    totalsRowStyle(mTotals);
    mTotals.getCell(4).numFmt = '0.0%';
    mTotals.getCell(6).numFmt = '€#,##0.00';
    mTotals.getCell(7).numFmt = '€#,##0.00';
    mTotals.getCell(10).numFmt = '0.0%';

    // ── Sheet 2: Monthly Deep-Dive ────────────────────────────────────────────
    const ws2 = workbook.addWorksheet('Monthly Deep-Dive');
    ws2.columns = colWidths.map((w) => ({ width: w }));

    const m2Title = ws2.addRow(['Monthly Deep-Dive — Full Detail (Last 6 Months)']);
    ws2.mergeCells(`A${m2Title.number}:J${m2Title.number}`);
    headerStyle(ws2, m2Title);

    const m2H = ws2.addRow(['Month', 'New Customers', 'Returning Customers', 'Retention Rate', 'Total Visits', 'Total Spend (€)', 'Avg Spend/Visit (€)', 'Redemptions', 'Churn Count', 'Churn Rate']);
    subHeaderStyle(m2H);

    const m2Start = ws2.lastRow!.number + 1;
    for (const row of data.monthly) {
      const r = ws2.addRow([row.month_label, row.new_customers, row.returning_customers, row.retention_rate / 100, row.total_visits, row.total_spend_eur, row.avg_spend_per_visit, row.redemptions, row.churn_count, row.churn_rate / 100]);
      r.getCell(4).numFmt = '0.0%';
      r.getCell(6).numFmt = '€#,##0.00';
      r.getCell(7).numFmt = '€#,##0.00';
      r.getCell(10).numFmt = '0.0%';
      retentionCellStyle(r.getCell(4), row.retention_rate);
      r.eachCell((c) => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
    }
    const m2End = ws2.lastRow!.number;

    const m2Tot = ws2.addRow([
      'TOTALS / AVG',
      { formula: `SUM(B${m2Start}:B${m2End})` },
      { formula: `SUM(C${m2Start}:C${m2End})` },
      { formula: `AVERAGE(D${m2Start}:D${m2End})` },
      { formula: `SUM(E${m2Start}:E${m2End})` },
      { formula: `SUM(F${m2Start}:F${m2End})` },
      { formula: `AVERAGE(G${m2Start}:G${m2End})` },
      { formula: `SUM(H${m2Start}:H${m2End})` },
      { formula: `SUM(I${m2Start}:I${m2End})` },
      { formula: `AVERAGE(J${m2Start}:J${m2End})` },
    ]);
    totalsRowStyle(m2Tot);
    m2Tot.getCell(4).numFmt = '0.0%';
    m2Tot.getCell(6).numFmt = '€#,##0.00';
    m2Tot.getCell(7).numFmt = '€#,##0.00';
    m2Tot.getCell(10).numFmt = '0.0%';

    // ── Sheet 3: Daily Activity ───────────────────────────────────────────────
    const ws3 = workbook.addWorksheet('Daily Activity');
    ws3.columns = [{ width: 14 }, { width: 13 }, { width: 13 }, { width: 15 }, { width: 18 }, { width: 15 }, { width: 14 }, { width: 14 }];

    const d3Title = ws3.addRow(['Daily Activity — Last 30 Days']);
    ws3.mergeCells(`A${d3Title.number}:H${d3Title.number}`);
    headerStyle(ws3, d3Title);

    const d3H = ws3.addRow(['Date', 'Day', 'Total Visits', 'New Customers', 'Returning Customers', 'Total Spend (€)', 'Redemptions', 'Retention Rate']);
    subHeaderStyle(d3H);

    const d3Start = ws3.lastRow!.number + 1;
    for (const row of data.daily) {
      const r = ws3.addRow([row.date, row.day_of_week, row.total_visits, row.new_customers, row.returning_customers, row.total_spend_eur, row.redemptions, row.retention_rate / 100]);
      r.getCell(6).numFmt = '€#,##0.00';
      r.getCell(8).numFmt = '0.0%';
      if (row.is_weekend) {
        r.eachCell((c) => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
        });
      }
      retentionCellStyle(r.getCell(8), row.retention_rate);
      r.eachCell((c) => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
    }
    const d3End = ws3.lastRow!.number;

    const d3Tot = ws3.addRow([
      'TOTALS / AVG', '',
      { formula: `SUM(C${d3Start}:C${d3End})` },
      { formula: `SUM(D${d3Start}:D${d3End})` },
      { formula: `SUM(E${d3Start}:E${d3End})` },
      { formula: `SUM(F${d3Start}:F${d3End})` },
      { formula: `SUM(G${d3Start}:G${d3End})` },
      { formula: `AVERAGE(H${d3Start}:H${d3End})` },
    ]);
    totalsRowStyle(d3Tot);
    d3Tot.getCell(6).numFmt = '€#,##0.00';
    d3Tot.getCell(8).numFmt = '0.0%';

    // ── Sheet 4: Campaign Performance ────────────────────────────────────────
    const ws4 = workbook.addWorksheet('Campaign Performance');
    ws4.columns = [{ width: 22 }, { width: 13 }, { width: 24 }, { width: 13 }, { width: 10 }, { width: 11 }, { width: 11 }, { width: 16 }, { width: 14 }, { width: 14 }];

    const c4Title = ws4.addRow(['Campaign Performance']);
    ws4.mergeCells(`A${c4Title.number}:J${c4Title.number}`);
    headerStyle(ws4, c4Title);

    const c4H = ws4.addRow(['Campaign Name', 'Type', 'Reward Description', 'Launch Date', 'Status', 'Enrolled', 'Redeemed', 'Completion Rate', 'Points Issued', 'Est. Value (€)']);
    subHeaderStyle(c4H);

    const c4Start = ws4.lastRow!.number + 1;
    for (const row of data.campaigns) {
      const r = ws4.addRow([row.name, row.campaign_type, row.reward_description, row.start_date, row.status, row.enrolled, row.redeemed, row.completion_rate / 100, row.points_issued, row.est_value_eur]);
      r.getCell(8).numFmt = '0.0%';
      r.getCell(10).numFmt = '€#,##0.00';
      if (row.status === 'active') {
        r.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        r.getCell(5).font = { color: { argb: 'FF276221' }, bold: true, size: 10, name: 'Arial' };
      } else {
        r.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        r.getCell(5).font = { color: { argb: 'FF4A5568' }, size: 10, name: 'Arial' };
      }
      r.eachCell((c) => { c.alignment = { horizontal: 'center', vertical: 'middle' }; });
    }
    const c4End = ws4.lastRow!.number;

    const c4Tot = ws4.addRow([
      'TOTALS / AVG', '', '', '', '',
      { formula: `SUM(F${c4Start}:F${c4End})` },
      { formula: `SUM(G${c4Start}:G${c4End})` },
      { formula: `AVERAGE(H${c4Start}:H${c4End})` },
      { formula: `SUM(I${c4Start}:I${c4End})` },
      { formula: `SUM(J${c4Start}:J${c4End})` },
    ]);
    totalsRowStyle(c4Tot);
    c4Tot.getCell(8).numFmt = '0.0%';
    c4Tot.getCell(10).numFmt = '€#,##0.00';

    // ── Stream buffer ─────────────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="letloyal-retention-report-${today}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Failed to generate export.' }, { status: 500 });
  }
}
