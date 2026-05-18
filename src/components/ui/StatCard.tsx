'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  delta?: number;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
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

export default function StatCard({ label, value, icon, delta, prefix = '', suffix = '', loading }: StatCardProps) {
  const displayed = useCountUp(value);

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-8 w-16 rounded mb-2" />
        <div className="skeleton h-4 w-24 rounded" />
      </div>
    );
  }

  const TrendIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const trendColor = delta === undefined ? 'text-text-light' : delta > 0 ? 'text-status-success' : 'text-status-error';

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="p-2.5 bg-primary-light rounded-xl text-primary">
          {icon}
        </div>
        {delta !== undefined && (
          <div className={clsx('flex items-center gap-1 text-xs font-semibold', trendColor)}>
            <TrendIcon size={14} />
            <span>{Math.abs(delta)}</span>
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold font-sora text-text-dark">
          {prefix}{displayed.toLocaleString()}{suffix}
        </div>
        <div className="text-sm text-text-medium mt-0.5">{label}</div>
      </div>
    </div>
  );
}
