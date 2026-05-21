'use client';

import type { ReportData } from '@/types/report';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Area, AreaChart, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: ReportData;
}

function RetentionBadge({ value }: { value: number }) {
  if (value >= 70) return <span className="font-bold text-green-700">{value.toFixed(1)}%</span>;
  if (value >= 60) return <span className="font-bold text-amber-700">{value.toFixed(1)}%</span>;
  if (value === 0) return <span className="text-text-light">—</span>;
  return <span className="font-bold text-red-700">{value.toFixed(1)}%</span>;
}

export default function DailyActivity({ data }: Props) {
  const { daily } = data;

  const maxVisits = Math.max(...daily.map((d) => d.total_visits), 1);

  const chartData = daily.map((r) => ({
    date: r.date.slice(5), // "MM-DD"
    Visits: r.total_visits,
  }));

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-jakarta font-bold text-xl text-text-dark">Daily Activity</h2>
        <p className="text-sm text-text-medium mt-0.5">Customer visits and retention over the last 30 days.</p>
      </div>

      {/* Area chart */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 mb-6">
        <h3 className="font-jakarta font-semibold text-sm text-text-dark mb-4">Daily Visits — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#4A5568' }}
              interval={Math.floor(daily.length / 6)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#4A5568' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
              labelFormatter={(v) => `Date: ${v}`}
            />
            <Area
              type="monotone"
              dataKey="Visits"
              stroke="#0D9488"
              strokeWidth={2.5}
              fill="url(#visitGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#0D9488' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily table */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border">
          <h3 className="font-jakarta font-bold text-base text-text-dark">Daily Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-brand-border">
                {['Date', 'Day', 'Visits', 'New', 'Returning', 'Spend (€)', 'Redemptions', 'Retention'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-text-medium uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {daily.map((row) => (
                <tr
                  key={row.date}
                  className={row.is_weekend ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-gray-50/50'}
                >
                  <td className="px-3 py-2.5 font-medium text-text-dark whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-2.5 text-text-medium text-xs">{row.day_of_week}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-text-dark font-medium w-6">{row.total_visits}</span>
                      {row.total_visits > 0 && (
                        <div className="flex-1 max-w-[60px] h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400"
                            style={{ width: `${Math.round((row.total_visits / maxVisits) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-text-dark">{row.new_customers}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.returning_customers}</td>
                  <td className="px-3 py-2.5 text-text-dark">€{row.total_spend_eur.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.redemptions}</td>
                  <td className="px-3 py-2.5"><RetentionBadge value={row.retention_rate} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-teal-500 font-bold text-sm">
                <td className="px-3 py-3 text-xs uppercase text-text-dark tracking-wide" colSpan={2}>Totals</td>
                <td className="px-3 py-3 text-text-dark">{daily.reduce((s, r) => s + r.total_visits, 0)}</td>
                <td className="px-3 py-3 text-text-dark">{daily.reduce((s, r) => s + r.new_customers, 0)}</td>
                <td className="px-3 py-3 text-text-dark">{daily.reduce((s, r) => s + r.returning_customers, 0)}</td>
                <td className="px-3 py-3 text-text-dark">€{daily.reduce((s, r) => s + r.total_spend_eur, 0).toFixed(2)}</td>
                <td className="px-3 py-3 text-text-dark">{daily.reduce((s, r) => s + r.redemptions, 0)}</td>
                <td className="px-3 py-3">
                  <RetentionBadge
                    value={
                      daily.length > 0
                        ? Math.round(daily.reduce((s, r) => s + r.retention_rate, 0) / daily.length * 10) / 10
                        : 0
                    }
                  />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
