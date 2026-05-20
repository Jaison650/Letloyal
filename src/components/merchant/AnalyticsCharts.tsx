'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import StatCard from '@/components/ui/StatCard';
import { TrendingUp, Users, Target, RotateCcw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active:         '#0D9488',
  reward_unlocked:'#5EEAD4',
  otp_pending:    '#F57C00',
  completed:      '#94A3B8',
};

const STATUS_LABELS: Record<string, string> = {
  active:         'Active',
  reward_unlocked:'Reward Ready',
  otp_pending:    'OTP Pending',
  completed:      'Completed',
};

interface CampaignStat {
  name: string;
  campaign_type: string;
  status: string;
  participants_count: number;
  redemptions_count: number;
  avg_visits: number;
}

interface Props {
  rescanRate: number;
  dailyScans: { date: string; scans: number }[];
  statusBreakdown: { status: string; count: number }[];
  enrollmentGrowth: { date: string; total: number }[];
  campaignStats: CampaignStat[];
  brandColor: string;
}

const tooltipStyle = { borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 13 };

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

export default function AnalyticsCharts({
  rescanRate, dailyScans, statusBreakdown, enrollmentGrowth, campaignStats, brandColor,
}: Props) {
  const totalCustomers = statusBreakdown.reduce((s, r) => s + r.count, 0);
  const totalScans     = dailyScans.reduce((s, d) => s + d.scans, 0);
  const avgVisits      = campaignStats.length
    ? (campaignStats.reduce((s, c) => s + (c.avg_visits || 0), 0) / campaignStats.length).toFixed(1)
    : '0';

  const pieData = statusBreakdown.map(s => ({
    name:  STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#E2E8F0',
  }));

  const barData = dailyScans.map(d => ({ date: shortDate(d.date), scans: d.scans }));
  const lineData = enrollmentGrowth.map(d => ({ date: shortDate(d.date), total: d.total }));

  return (
    <div className="space-y-6">

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Re-scan Rate"    value={rescanRate}      icon={<RotateCcw size={20} />} suffix="%" />
        <StatCard label="Total Customers" value={totalCustomers}  icon={<Users size={20} />} />
        <StatCard label="Scans (30 days)" value={totalScans}      icon={<TrendingUp size={20} />} />
        <StatCard label="Avg Visits/Customer" value={parseFloat(avgVisits)} icon={<Target size={20} />} />
      </div>

      {/* Row 2 — Daily scans bar chart (full width) */}
      <div className="card">
        <h3 className="font-jakarta font-bold text-lg mb-5">Daily Scans — Last 30 Days</h3>
        {barData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-text-light text-sm">No scan data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(barData.length / 8)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: '#E6F4F6' }}
              />
              <Bar
                dataKey="scans"
                fill={brandColor}
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: '#5EEAD4' }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3 — Pie + Line side by side */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Donut: customer status */}
        <div className="card">
          <h3 className="font-jakarta font-bold text-lg mb-5">Customer Status Breakdown</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-light text-sm">No customer data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="46%"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 12, color: '#64748B' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line: cumulative enrollments */}
        <div className="card">
          <h3 className="font-jakarta font-bold text-lg mb-5">Cumulative Enrollments</h3>
          {lineData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-text-light text-sm">No enrollment data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(lineData.length / 5) || 0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#5EEAD4"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#0D9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 4 — Campaign performance table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-brand-border">
          <h3 className="font-jakarta font-bold text-lg">Campaign Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-bg">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Type</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Participants</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Redeemed</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide hidden sm:table-cell">Avg Visits</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {campaignStats.map((c, i) => {
                const rate = c.participants_count > 0
                  ? Math.round((c.redemptions_count / c.participants_count) * 100)
                  : 0;
                return (
                  <tr key={i} className="hover:bg-brand-bg transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-text-light capitalize">{c.status}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-text-medium capitalize">
                      {c.campaign_type.replace('_', '-')}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-right text-primary font-semibold">{c.participants_count}</td>
                    <td className="px-4 py-3.5 text-sm text-right text-accent font-semibold">{c.redemptions_count}</td>
                    <td className="px-4 py-3.5 text-sm text-right text-text-medium hidden sm:table-cell">
                      {c.avg_visits > 0 ? c.avg_visits.toFixed(1) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right font-bold">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
