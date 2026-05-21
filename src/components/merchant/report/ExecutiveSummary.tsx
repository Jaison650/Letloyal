'use client';

import type { ReportData } from '@/types/report';
import { Users, RotateCcw, TrendingUp, DollarSign } from 'lucide-react';

interface Props {
  data: ReportData;
}

function RetentionBadge({ value }: { value: number }) {
  if (value >= 70) return <span className="font-bold text-green-700">{value.toFixed(1)}%</span>;
  if (value >= 60) return <span className="font-bold text-amber-700">{value.toFixed(1)}%</span>;
  return <span className="font-bold text-red-700">{value.toFixed(1)}%</span>;
}

export default function ExecutiveSummary({ data }: Props) {
  const { kpis, monthly } = data;

  const kpiCards = [
    {
      label: 'Total Active Customers',
      value: kpis.total_active_customers.toLocaleString(),
      icon: <Users size={20} className="text-white" />,
      desc: 'Currently enrolled & active',
    },
    {
      label: 'Avg Monthly Retention',
      value: `${kpis.avg_retention_rate.toFixed(1)}%`,
      icon: <TrendingUp size={20} className="text-white" />,
      desc: 'Returning / total active customers',
      highlight: kpis.avg_retention_rate,
    },
    {
      label: 'Total Redemptions',
      value: kpis.total_redemptions.toLocaleString(),
      icon: <RotateCcw size={20} className="text-white" />,
      desc: 'Last 6 months',
    },
    {
      label: 'Avg Spend / Visit',
      value: `€${kpis.avg_spend_per_visit.toFixed(2)}`,
      icon: <DollarSign size={20} className="text-white" />,
      desc: 'Spend-based campaigns only',
    },
  ];

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-jakarta font-bold text-xl text-text-dark">Executive Summary</h2>
        <p className="text-sm text-text-medium mt-0.5">Key performance indicators for the last 6 months.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => {
          const isRetention = card.highlight !== undefined;
          const cardBg =
            isRetention && card.highlight !== undefined
              ? card.highlight >= 70
                ? 'from-green-600 to-green-500'
                : card.highlight >= 60
                ? 'from-amber-500 to-amber-400'
                : 'from-red-600 to-red-500'
              : 'from-teal-700 to-teal-500';

          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cardBg} flex items-center justify-center mb-3`}>
                {card.icon}
              </div>
              <p className="font-jakarta font-bold text-2xl text-text-dark">{card.value}</p>
              <p className="text-xs font-semibold text-text-medium mt-0.5">{card.label}</p>
              <p className="text-xs text-text-light mt-1">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-jakarta font-bold text-base text-text-dark">Monthly Performance</h3>
          <span className="text-xs text-text-light">Last 6 months</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-brand-border">
                {['Month', 'New Customers', 'Returning Customers', 'Retention Rate', 'Total Visits', 'Redemptions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-medium uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {monthly.map((row) => (
                <tr key={row.month} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-dark whitespace-nowrap">{row.month_label}</td>
                  <td className="px-4 py-3 text-text-dark">{row.new_customers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-dark">{row.returning_customers.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <RetentionBadge value={row.retention_rate} />
                  </td>
                  <td className="px-4 py-3 text-text-dark">{row.total_visits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-dark">{row.redemptions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-teal-500 font-bold">
                <td className="px-4 py-3 text-text-dark text-xs uppercase tracking-wide">Avg / Total</td>
                <td className="px-4 py-3 text-text-dark">
                  {Math.round(monthly.reduce((s, r) => s + r.new_customers, 0) / (monthly.length || 1)).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-text-dark">
                  {Math.round(monthly.reduce((s, r) => s + r.returning_customers, 0) / (monthly.length || 1)).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <RetentionBadge
                    value={
                      monthly.length > 0
                        ? Math.round(monthly.reduce((s, r) => s + r.retention_rate, 0) / monthly.length * 10) / 10
                        : 0
                    }
                  />
                </td>
                <td className="px-4 py-3 text-text-dark">
                  {monthly.reduce((s, r) => s + r.total_visits, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-text-dark">
                  {monthly.reduce((s, r) => s + r.redemptions, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
