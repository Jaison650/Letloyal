'use client';

import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import type { ReportData } from '@/types/report';
import ExecutiveSummary from './ExecutiveSummary';
import MonthlyDeepDive from './MonthlyDeepDive';
import DailyActivity from './DailyActivity';
import CampaignPerformance from './CampaignPerformance';

interface Props {
  slug: string;
  merchantName: string;
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonBlock({ h = 'h-40' }: { h?: string }) {
  return <div className={`${h} bg-gray-100 rounded-2xl animate-pulse`} />;
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonBlock key={i} h="h-28" />)}
      </div>
      <SkeletonBlock h="h-52" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBlock h="h-64" />
        <SkeletonBlock h="h-64" />
      </div>
      <SkeletonBlock h="h-64" />
      <SkeletonBlock h="h-64" />
    </div>
  );
}

// ── PDF Export ────────────────────────────────────────────────────────────────
async function handlePdfExport(data: ReportData, merchantName: string) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const TEAL: [number, number, number] = [13, 148, 136];
  const DARK: [number, number, number] = [15, 23, 42];
  const WHITE: [number, number, number] = [255, 255, 255];

  // ── Per-page header/footer helper ─────────────────────────────────────────
  function addPageChrome(pageNum: number, total: number) {
    // Header bar
    doc.setFillColor(...TEAL);
    doc.rect(0, 0, W, 12, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text('LetLoyal Merchant Retention Report', 8, 8);
    doc.text(`Page ${pageNum} of ${total}`, W - 8, 8, { align: 'right' });

    // Footer
    doc.setFillColor(...TEAL);
    doc.rect(0, H - 8, W, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'normal');
    doc.text(merchantName, 8, H - 3);
    doc.text('Confidential', W / 2, H - 3, { align: 'center' });
    doc.text('LetLoyal Analytics', W - 8, H - 3, { align: 'right' });
  }

  const totalPages = 6;
  let currentPage = 1;

  // ── Cover page ────────────────────────────────────────────────────────────
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, H, 'F');

  doc.setFillColor(...DARK);
  doc.roundedRect(10, 10, W - 20, H - 20, 6, 6, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('LetLoyal', W / 2, H / 2 - 28, { align: 'center' });
  doc.setFontSize(18);
  doc.text('Merchant Retention Report', W / 2, H / 2 - 14, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(94, 234, 212);
  doc.text(merchantName, W / 2, H / 2 + 2, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(160, 174, 192);
  doc.text(`Period: ${data.meta.period_start} — ${data.meta.period_end}`, W / 2, H / 2 + 14, { align: 'center' });
  doc.text(`Generated: ${new Date(data.meta.generated_at).toLocaleString('en-GB')}`, W / 2, H / 2 + 22, { align: 'center' });

  addPageChrome(currentPage, totalPages);

  // ── Section 1: Executive Summary ─────────────────────────────────────────
  doc.addPage();
  currentPage++;
  addPageChrome(currentPage, totalPages);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('1. Executive Summary — KPIs', 10, 20);

  // KPI mini-table
  (doc as any).autoTable({
    startY: 24,
    head: [['Metric', 'Value']],
    body: [
      ['Total Active Customers', data.kpis.total_active_customers.toLocaleString()],
      ['Total Redemptions (6mo)', data.kpis.total_redemptions.toLocaleString()],
      ['Avg Spend / Visit (€)', `€${data.kpis.avg_spend_per_visit.toFixed(2)}`],
      ['Avg Monthly Retention Rate', `${data.kpis.avg_retention_rate.toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [2, 128, 144] as [number, number, number], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    margin: { left: 10, right: 10 },
    tableWidth: 100,
  });

  const afterKPI = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Monthly Performance Summary', 10, afterKPI);

  (doc as any).autoTable({
    startY: afterKPI + 4,
    head: [['Month', 'New', 'Returning', 'Retention %', 'Visits', 'Redemptions']],
    body: data.monthly.map((r) => [
      r.month_label,
      r.new_customers,
      r.returning_customers,
      `${r.retention_rate.toFixed(1)}%`,
      r.total_visits,
      r.redemptions,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [2, 128, 144] as [number, number, number], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    margin: { left: 10, right: 10 },
  });

  // ── Section 2: Monthly Deep-Dive ─────────────────────────────────────────
  doc.addPage();
  currentPage++;
  addPageChrome(currentPage, totalPages);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('2. Monthly Deep-Dive', 10, 20);

  (doc as any).autoTable({
    startY: 24,
    head: [['Month', 'New', 'Returning', 'Ret. %', 'Visits', 'Spend (€)', 'Avg €/Visit', 'Redemptions', 'Churn', 'Churn %']],
    body: data.monthly.map((r) => [
      r.month_label,
      r.new_customers,
      r.returning_customers,
      `${r.retention_rate.toFixed(1)}%`,
      r.total_visits,
      `€${r.total_spend_eur.toFixed(2)}`,
      `€${r.avg_spend_per_visit.toFixed(2)}`,
      r.redemptions,
      r.churn_count,
      `${r.churn_rate.toFixed(1)}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [2, 128, 144] as [number, number, number], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    margin: { left: 10, right: 10 },
  });

  // ── Section 3: Daily Activity ─────────────────────────────────────────────
  doc.addPage();
  currentPage++;
  addPageChrome(currentPage, totalPages);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('3. Daily Activity — Last 30 Days', 10, 20);

  (doc as any).autoTable({
    startY: 24,
    head: [['Date', 'Day', 'Visits', 'New', 'Returning', 'Spend (€)', 'Redemptions', 'Retention %']],
    body: data.daily.map((r) => [
      r.date,
      r.day_of_week,
      r.total_visits,
      r.new_customers,
      r.returning_customers,
      `€${r.total_spend_eur.toFixed(2)}`,
      r.redemptions,
      r.retention_rate > 0 ? `${r.retention_rate.toFixed(1)}%` : '—',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [2, 128, 144] as [number, number, number], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    margin: { left: 10, right: 10 },
    didParseCell: (hookData: any) => {
      if (hookData.section === 'body') {
        const dayOfWeek = hookData.row.raw[1];
        if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
          hookData.cell.styles.fillColor = [255, 251, 235];
        }
      }
    },
  });

  // ── Section 4: Campaign Performance ──────────────────────────────────────
  doc.addPage();
  currentPage++;
  addPageChrome(currentPage, totalPages);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('4. Campaign Performance', 10, 20);

  (doc as any).autoTable({
    startY: 24,
    head: [['Campaign', 'Type', 'Status', 'Enrolled', 'Redeemed', 'Completion', 'Est. Value (€)']],
    body: data.campaigns.map((r) => [
      r.name,
      r.campaign_type === 'visit_based' ? 'Visit' : 'Spend',
      r.status,
      r.enrolled,
      r.redeemed,
      `${r.completion_rate.toFixed(1)}%`,
      `€${r.est_value_eur.toFixed(2)}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [2, 128, 144] as [number, number, number], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    margin: { left: 10, right: 10 },
    didParseCell: (hookData: any) => {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const status = hookData.row.raw[2];
        if (status === 'active') {
          hookData.cell.styles.fillColor = [198, 239, 206];
          hookData.cell.styles.textColor = [39, 98, 33];
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // ── Section 5: SMS/WhatsApp Campaign Enabler ──────────────────────────────
  doc.addPage();
  currentPage++;
  addPageChrome(currentPage, totalPages);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('5. SMS & WhatsApp Campaign Enabler', 10, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(74, 85, 104);

  const noteText = [
    'Push notification campaigns via SMS and WhatsApp are planned for production rollout.',
    '',
    'This will enable merchants to:',
    '  • Notify customers close to reward thresholds',
    '  • Send win-back messages to lapsed customers',
    '  • Broadcast promotional offers and flash deals',
    '',
    'Once enabled, merchants will be able to segment their customer base by retention status,',
    'visit frequency, and last activity date — and trigger automated or manual campaigns',
    'directly from the LetLoyal dashboard.',
  ];
  let yPos = 30;
  for (const line of noteText) {
    doc.text(line, 10, yPos);
    yPos += 6;
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  doc.save(`letloyal-retention-report-${today}.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RetentionReport({ slug, merchantName }: Props) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/merchants/${slug}/report`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ReportData = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  async function onPdfExport() {
    if (!data) return;
    setPdfLoading(true);
    try {
      await handlePdfExport(data, merchantName);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-700 to-teal-500 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h1 className="font-jakarta font-bold text-2xl lg:text-3xl text-text-dark">Retention Report</h1>
          </div>
          <p className="text-sm text-text-medium">
            {data
              ? `Period: ${data.meta.period_start} — ${data.meta.period_end}`
              : 'Analysing your loyalty programme performance…'}
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => window.open(`/api/merchants/${slug}/report/export?format=xlsx`)}
            disabled={loading || !!error}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-brand-border text-text-dark hover:bg-gray-50 hover:border-teal-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-teal-600" />
            Export Excel
          </button>

          <button
            onClick={onPdfExport}
            disabled={loading || !!error || pdfLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0D9488, #5EEAD4)' }}
          >
            {pdfLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {pdfLoading ? 'Generating…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* States */}
      {loading && <ReportSkeleton />}

      {!loading && error && (
        <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="font-semibold">Failed to load report</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-12">
          <ExecutiveSummary data={data} />
          <hr className="border-brand-border" />
          <MonthlyDeepDive data={data} />
          <hr className="border-brand-border" />
          <DailyActivity data={data} />
          <hr className="border-brand-border" />
          <CampaignPerformance data={data} />
        </div>
      )}
    </div>
  );
}
