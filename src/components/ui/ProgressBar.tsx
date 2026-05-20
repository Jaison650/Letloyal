'use client';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0–100
  height?: 'sm' | 'md' | 'lg';
  color?: string; // custom gradient start
  className?: string;
  animate?: boolean;
  showLabel?: boolean;
}

export default function ProgressBar({ value, height = 'md', className, animate = true, showLabel }: ProgressBarProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : value);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (animate) {
        requestAnimationFrame(() => setDisplayed(value));
      }
    }
  }, [value, animate]);

  const clamped = Math.min(100, Math.max(0, value));
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full bg-brand-border rounded-full overflow-hidden', heights[height])}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${displayed}%`,
            background: 'linear-gradient(90deg, #5EEAD4, #0D9488)',
            transition: animate ? 'width 800ms ease' : 'none',
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-text-light font-medium">
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
    </div>
  );
}
