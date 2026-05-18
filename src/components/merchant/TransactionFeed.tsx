'use client';
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface Transaction {
  customer_name: string;
  masked_phone: string;
  timestamp: string;
  type: string;
  points: number;
  campaign: string;
}

interface TransactionFeedProps {
  merchantSlug: string;
  initialTransactions: Transaction[];
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function TransactionFeed({ merchantSlug, initialTransactions }: TransactionFeedProps) {
  const [txns, setTxns] = useState<Transaction[]>(initialTransactions);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/merchants/${merchantSlug}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setTxns(data.recent_transactions || []);
        setLastUpdated(new Date());
      }
    } catch { /* silent */ }
  }, [merchantSlug]);

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!txns.length) {
    return (
      <div className="card">
        <h3 className="font-sora font-bold text-lg mb-4">Recent Transactions</h3>
        <div className="flex flex-col items-center justify-center py-10 text-center text-text-light gap-3">
          <TrendingUp size={36} className="opacity-30" />
          <p className="text-sm">No transactions yet today — show your QR to your next customer!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-sora font-bold text-lg">Recent Transactions</h3>
        <div className="flex items-center gap-2 text-xs text-text-light">
          <RefreshCw size={12} />
          <span>Updated {timeAgo(lastUpdated.toISOString())}</span>
        </div>
      </div>
      <div className="space-y-2 overflow-hidden">
        {txns.map((t, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-bg transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'earn' ? 'bg-green-50' : 'bg-red-50'}`}>
              {t.type === 'earn'
                ? <TrendingUp size={14} className="text-status-success" />
                : <TrendingDown size={14} className="text-status-error" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.customer_name}</p>
              <p className="text-xs text-text-light truncate">{t.campaign}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${t.type === 'earn' ? 'text-status-success' : 'text-status-error'}`}>
                {t.type === 'earn' ? '+' : ''}{t.points} pt{Math.abs(t.points) !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-text-light">{timeAgo(t.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
