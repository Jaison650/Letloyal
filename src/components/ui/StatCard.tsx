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
  label, value, icon, delta, prefix = '', suffix = '', loading, accentColor = '#0D9488',
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
      className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 border border-brand-border shadow-card overflow-hidden relative"
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      {/* Subtle bg tint */}
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-4 translate-x-4 opacity-[0.06]"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between mb-2 relative">
        <div
          className="p-2 rounded-xl"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trendColor}`}>
            <TrendIcon size={11} />
            <span>{Math.abs(delta)}</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          className="text-2xl sm:text-3xl font-bold font-jakarta leading-none"
          style={{ color: '#0F172A' }}
        >
          {prefix}{displayed.toLocaleString()}{suffix}
        </div>
        <div className="text-[10px] sm:text-xs font-semibold text-text-medium mt-1 uppercase tracking-wide leading-tight">{label}</div>
      </div>
    </div>
  );
}
