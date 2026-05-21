'use client';

import type { ReportData } from '@/types/report';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: ReportData;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
      {status}
    </span>
  );
}

export default function CampaignPerformance({ data }: Props) {
  const { campaigns } = data;

  const chartData = campaigns.slice(0, 8).map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name,
    Enrolled: c.enrolled,
    Redeemed: c.redeemed,
  }));

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-jakarta font-bold text-xl text-text-dark">Campaign Performance</h2>
        <p className="text-sm text-text-medium mt-0.5">Enrollment, redemption and completion rates across all campaigns.</p>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm p-5 mb-6">
        <h3 className="font-jakarta font-semibold text-sm text-text-dark mb-4">Enrolled vs Redeemed (top 8)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4A5568' }} />
            <YAxis tick={{ fontSize: 11, fill: '#4A5568' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 12 }}
              cursor={{ fill: 'rgba(13,148,136,0.06)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Enrolled" fill="#0D9488" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Redeemed" fill="#5EEAD4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border">
          <h3 className="font-jakarta font-bold text-base text-text-dark">All Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-brand-border">
                {['Campaign', 'Type', 'Reward', 'Launch', 'Status', 'Enrolled', 'Redeemed', 'Completion', 'Points', 'Est. Value'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-text-medium uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {campaigns.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-text-dark max-w-[160px] truncate" title={row.name}>
                    {row.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-medium whitespace-nowrap">
                      {row.campaign_type === 'visit_based' ? 'Visit' : 'Spend'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-medium max-w-[160px] truncate text-xs" title={row.reward_description}>
                    {row.reward_description}
                  </td>
                  <td className="px-3 py-2.5 text-text-medium text-xs whitespace-nowrap">{row.start_date}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={row.status} /></td>
                  <td className="px-3 py-2.5 text-text-dark">{row.enrolled.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-text-dark">{row.redeemed.toLocaleString()}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${Math.min(row.completion_rate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-text-dark">{row.completion_rate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-text-dark">{row.points_issued.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-semibold text-teal-700">€{row.est_value_eur.toFixed(2)}</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-text-light">No campaign data available.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-teal-500 font-bold text-sm">
                <td className="px-3 py-3 text-xs uppercase text-text-dark tracking-wide" colSpan={5}>Totals</td>
                <td className="px-3 py-3 text-text-dark">{campaigns.reduce((s, r) => s + r.enrolled, 0).toLocaleString()}</td>
                <td className="px-3 py-3 text-text-dark">{campaigns.reduce((s, r) => s + r.redeemed, 0).toLocaleString()}</td>
                <td className="px-3 py-3 text-text-dark">
                  {campaigns.length > 0
                    ? `${(campaigns.reduce((s, r) => s + r.completion_rate, 0) / campaigns.length).toFixed(1)}%`
                    : '—'}
                </td>
                <td className="px-3 py-3 text-text-dark">{campaigns.reduce((s, r) => s + r.points_issued, 0).toLocaleString()}</td>
                <td className="px-3 py-3 text-teal-700">€{campaigns.reduce((s, r) => s + r.est_value_eur, 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
