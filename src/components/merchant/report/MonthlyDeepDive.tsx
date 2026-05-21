'use client';

import type { ReportData } from '@/types/report';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: ReportData;
}

function RetentionBadge({ value }: { value: number }) {
  if (value >= 70) return <span className="font-bold text-green-700">{value.toFixed(1)}%</span>;
  if (value >= 60) return <span className="font-bold text-amber-700">{value.toFixed(1)}%</span>;
  return <span className="font-bold text-red-700">{value.toFixed(1)}%</span>;
}

export default function MonthlyDeepDive({ data }: Props) {
  const { monthly } = data;

  const chartData = monthly.map((r) => ({
    month: r.month_label,
    'New Customers': r.new_customers,
    'Returning Customers': r.returning_customers,
    'Retention Rate': Math.round(r.retention_rate * 10) / 10,
  }));

  const totalNew = monthly.reduce((s, r) => s + r.new_customers, 0);
  const totalRet = monthly.reduce((s, r) => s + r.returning_customers, 0);
  const totalVisits = monthly.reduce((s, r) => s + r.total_visits, 0);
  const totalSpend = monthly.reduce((s, r) => s + r.total_spend_eur, 0);
  const totalRed = monthly.reduce((s, r) => s + r.redemptions, 0);
  const totalChurn = monthly.reduce((s, r) => s + r.churn_count, 0);
  const avgRetention =
    monthly.length > 0
      ? Math.round(monthly.reduce((s, r) => s + r.retention_rate, 0) / monthly.length * 10) / 10
      : 0;
  const avgSpend =
    monthly.length > 0
      ? Math.round(monthly.reduce((s, r) => s + r.avg_spend_per_visit, 0) / monthly.length * 100) / 100
      : 0;
  const avgChurnRate =
    monthly.length > 0
      ? Math.round(monthly.reduce((s, r) => s + r.churn_rate, 0) / monthly.length * 10) / 10
      : 0;

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-jakarta font-bold text-xl text-text-dark">Monthly Deep-Dive</h2>
        <p className="text-sm text-text-medium mt-0.5">New vs returning customers and retention rate trend.</p>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Clustered Bar Chart */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5">
          <h3 className="font-jakarta font-semibold text-sm text-text-dark mb-4">New vs Returning Customers</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#4A5568' }} />
              <YAxis tick={{ fontSize: 11, fill: '#4A5568' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                cursor={{ fill: 'rgba(13,148,136,0.06)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Returning Customers" fill="#0D9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="New Customers" fill="#5EEAD4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Retention Rate Line Chart */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5">
          <h3 className="font-jakarta font-semibold text-sm text-text-dark mb-4">Retention Rate Trend (%)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#4A5568' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#4A5568' }} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, 'Retention Rate']}
              />
              <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="5 3" label={{ value: '70%', fill: '#22c55e', fontSize: 10 }} />
              <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: '60%', fill: '#f59e0b', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="Retention Rate"
                stroke="#0D9488"
                strokeWidth={2.5}
                dot={{ fill: '#0D9488', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full monthly table */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border">
          <h3 className="font-jakarta font-bold text-base text-text-dark">Full Monthly Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-brand-border">
                {['Month', 'New', 'Returning', 'Ret. Rate', 'Visits', 'Spend (€)', 'Avg €/Visit', 'Redemptions', 'Churn', 'Churn %'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-text-medium uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {monthly.map((row) => (
                <tr key={row.month} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-text-dark whitespace-nowrap">{row.month_label}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.new_customers}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.returning_customers}</td>
                  <td className="px-3 py-2.5"><RetentionBadge value={row.retention_rate} /></td>
                  <td className="px-3 py-2.5 text-text-dark">{row.total_visits}</td>
                  <td className="px-3 py-2.5 text-text-dark">€{row.total_spend_eur.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-text-dark">€{row.avg_spend_per_visit.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.redemptions}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.churn_count}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.churn_rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-teal-500 font-bold text-sm">
                <td className="px-3 py-3 text-xs uppercase tracking-wide text-text-dark">Totals / Avg</td>
                <td className="px-3 py-3 text-text-dark">{totalNew}</td>
                <td className="px-3 py-3 text-text-dark">{totalRet}</td>
                <td className="px-3 py-3"><RetentionBadge value={avgRetention} /></td>
                <td className="px-3 py-3 text-text-dark">{totalVisits}</td>
                <td className="px-3 py-3 text-text-dark">€{totalSpend.toFixed(2)}</td>
                <td className="px-3 py-3 text-text-dark">€{avgSpend.toFixed(2)}</td>
                <td className="px-3 py-3 text-text-dark">{totalRed}</td>
                <td className="px-3 py-3 text-text-dark">{totalChurn}</td>
                <td className="px-3 py-3 text-text-dark">{avgChurnRate.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
