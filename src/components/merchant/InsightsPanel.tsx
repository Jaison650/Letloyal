'use client';
import { useEffect, useState } from 'react';
import { ChevronRight, Zap, Bell } from 'lucide-react';
import Link from 'next/link';

interface Insight {
  type: string;
  icon: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export default function InsightsPanel({ merchantSlug }: { merchantSlug: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/merchants/${merchantSlug}/insights`)
      .then(r => r.json())
      .then(d => setInsights(d.insights || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [merchantSlug]);

  const priorityColor = { high: '#5EEAD4', medium: '#F57C00', low: '#0D9488' };
  const priorityBg = { high: '#5EEAD412', medium: '#F57C0012', low: '#0D948812' };

  if (loading) {
    return (
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-accent shrink-0" />
          <h3 className="font-jakarta font-bold text-base sm:text-lg">Customer Insights</h3>
        </div>
        {[1, 2].map(i => (
          <div key={i} className="h-14 bg-brand-bg rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-accent" />
          <h3 className="font-jakarta font-bold text-lg">Customer Insights</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-4xl mb-2">📊</p>
          <p className="text-sm text-text-light">Insights will appear as customers engage with your loyalty program.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 min-w-0">
        <Zap size={16} className="text-accent shrink-0" />
        <h3 className="font-jakarta font-bold text-base sm:text-lg flex-1 min-w-0 truncate">Customer Insights</h3>
        <Link
          href={`/merchant/${merchantSlug}/notifications`}
          className="shrink-0 flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
        >
          <Bell size={11} /> <span className="hidden sm:inline">Send </span>Campaign
        </Link>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="rounded-xl px-4 py-3 space-y-1"
            style={{ background: priorityBg[insight.priority] }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">{insight.icon}</span>
              <p className="font-semibold text-sm text-text-dark flex-1 min-w-0 line-clamp-1">{insight.title}</p>
              <span
                className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: priorityColor[insight.priority] }}
              >
                {insight.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-text-medium leading-relaxed">{insight.message}</p>
          </div>
        ))}
      </div>

      <Link
        href={`/merchant/${merchantSlug}/notifications`}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-brand-border text-sm font-semibold text-text-medium hover:bg-brand-bg transition-colors"
      >
        <Bell size={14} /> Send Customer Campaign <ChevronRight size={14} />
      </Link>
    </div>
  );
}
