'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  delta?: number;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  accentColor?: string;
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

export default function StatCard({
  label, value, icon, delta, prefix = '', suffix = '', loading, accentColor = '#028090',
}: StatCardProps) {
  const displayed = useCountUp(value);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card">
        <div className="skeleton h-10 w-10 rounded-xl mb-3" />
        <div className="skeleton h-8 w-16 rounded mb-1.5" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
    );
  }

  const TrendIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const trendColor = delta === undefined ? 'text-text-light' : delta > 0 ? 'text-status-success' : 'text-status-error';

  return (
    <div
      className="bg-white rounded-2xl p-5 border border-brand-border shadow-card overflow-hidden relative"
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      {/* Subtle bg tint */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-6 translate-x-6 opacity-[0.06]"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between mb-3 relative">
        <div
          className="p-2.5 rounded-xl"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            <span>{Math.abs(delta)}</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          className="text-3xl font-bold font-sora"
          style={{ color: '#1A1A1A' }}
        >
          {prefix}{displayed.toLocaleString()}{suffix}
        </div>
        <div className="text-xs font-semibold text-text-medium mt-1 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
