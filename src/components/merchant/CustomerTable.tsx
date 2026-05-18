'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, TrendingUp, Star, RotateCcw, X, Clock, List } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';

interface Customer {
  name: string;
  masked_phone: string;
  first_scan: string;
  points: number;
  visits: number;
  status: string;
  last_activity_at: string;
  cycle_number: number;
  threshold: number;
  campaign_type: string;
  campaign_name: string;
  progress_pct: number;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

const FILTERS = [
  { label: 'All',          value: 'all' },
  { label: 'Near Reward',  value: 'near_reward' },
  { label: 'Reward Ready', value: 'reward_unlocked' },
  { label: 'Redeemed',     value: 'redeemed' },
];

function statusBadge(status: string) {
  switch (status) {
    case 'reward_unlocked': return <Badge variant="unlocked"><Star size={10} /> Ready</Badge>;
    case 'otp_pending':     return <Badge variant="paused"><RotateCcw size={10} /> Pending</Badge>;
    default:                return <Badge variant="active"><TrendingUp size={10} /> Active</Badge>;
  }
}

function SlideOver({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const current    = customer.campaign_type === 'visit_based' ? customer.visits : customer.points;
  const unit       = customer.campaign_type === 'visit_based' ? 'visit' : 'point';
  const remaining  = Math.max(0, customer.threshold - current);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-slide-up lg:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h3 className="font-sora font-bold text-lg">Customer Details</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-brand-bg text-text-light"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-2xl font-sora shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-sora font-bold text-xl">{customer.name}</p>
              <p className="text-sm text-text-medium">{customer.masked_phone}</p>
            </div>
          </div>

          {/* Status + campaign */}
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(customer.status)}
            <span className="text-xs text-text-light bg-brand-bg border border-brand-border px-3 py-1 rounded-full">
              {customer.campaign_name}
            </span>
          </div>

          {/* Key dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-bg rounded-xl p-3">
              <p className="text-xs text-text-light font-medium">First Scan</p>
              <p className="font-semibold text-sm mt-0.5">
                {new Date(customer.first_scan).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-brand-bg rounded-xl p-3">
              <p className="text-xs text-text-light font-medium">Last Active</p>
              <p className="font-semibold text-sm mt-0.5">{timeAgo(customer.last_activity_at)}</p>
            </div>
            <div className="bg-brand-bg rounded-xl p-3">
              <p className="text-xs text-text-light font-medium">Cycles Completed</p>
              <p className="font-semibold text-sm mt-0.5">{Math.max(0, customer.cycle_number - 1)}</p>
            </div>
            <div className="bg-brand-bg rounded-xl p-3">
              <p className="text-xs text-text-light font-medium">Current Cycle</p>
              <p className="font-semibold text-sm mt-0.5">#{customer.cycle_number}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-text-dark">Progress</span>
              <span className="font-bold text-primary">{Math.round(customer.progress_pct)}%</span>
            </div>
            <ProgressBar value={Math.min(100, customer.progress_pct)} height="md" />
            <div className="flex items-center justify-between text-xs text-text-medium font-medium">
              <span>{current} / {customer.threshold} {unit}s</span>
              {customer.status !== 'reward_unlocked'
                ? <span className="text-text-light">{remaining} more {unit}{remaining !== 1 ? 's' : ''} to go</span>
                : <span className="text-accent font-semibold">🎉 Reward ready!</span>}
            </div>
          </div>

          {/* Transaction history placeholder */}
          <div className="border border-brand-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-brand-bg border-b border-brand-border flex items-center gap-2">
              <List size={14} className="text-text-light" />
              <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Transaction History</p>
            </div>
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-text-light">
              <Clock size={24} className="opacity-30" />
              <p className="text-xs text-center px-4">
                Full transaction history is available in the production version.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CustomerTable({ merchantSlug }: { merchantSlug: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ filter, search });
      const res = await fetch(`/api/merchants/${merchantSlug}/customers?${qs}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } finally {
      setLoading(false);
    }
  }, [merchantSlug, filter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCustomers, search]);

  return (
    <>
      {selected && <SlideOver customer={selected} onClose={() => setSelected(null)} />}

      <div className="space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="text"
              placeholder="Search by name or last 4 digits…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[44px] ${
                  filter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-white border border-brand-border text-text-medium hover:bg-brand-bg'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-text-light gap-3 px-4">
              <Filter size={36} className="opacity-30" />
              <p className="text-sm">No customers match this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide hidden md:table-cell">Campaign</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide hidden sm:table-cell">First Scan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Progress</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-light uppercase tracking-wide hidden lg:table-cell">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {customers.map((c, i) => (
                    <tr
                      key={i}
                      className="hover:bg-brand-bg transition-colors cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-sm">{c.name}</p>
                        <p className="text-xs text-text-light">{c.masked_phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-text-medium hidden md:table-cell max-w-[140px]">
                        <span className="truncate block">{c.campaign_name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-medium hidden sm:table-cell">
                        {new Date(c.first_scan).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3.5 min-w-[140px]">
                        <div className="space-y-1">
                          <ProgressBar value={Math.min(100, c.progress_pct)} height="sm" />
                          <p className="text-xs text-text-light">
                            {c.campaign_type === 'visit_based'
                              ? `${c.visits}/${c.threshold} visits`
                              : `${c.points}/${c.threshold} pts`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{statusBadge(c.status)}</td>
                      <td className="px-4 py-3.5 text-xs text-text-light hidden lg:table-cell">
                        {timeAgo(c.last_activity_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
