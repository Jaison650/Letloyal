'use client';

interface MilestoneStepsProps {
  current: number;
  total: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export default function MilestoneSteps({
  current,
  total,
  color = '#0D9488',
  size = 'md',
  showLabels = false,
}: MilestoneStepsProps) {
  if (total > 15) return null;

  const dotSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  const connSize = size === 'sm' ? 'h-0.5 w-3' : size === 'lg' ? 'h-1 w-6' : 'h-0.5 w-4';
  const checkSize = size === 'lg' ? 'text-[10px]' : 'text-[8px]';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center">
        {Array.from({ length: total }, (_, i) => {
          const filled = i < current;
          const isCurrent = i === current;
          return (
            <div key={i} className="flex items-center">
              <div
                className={`${dotSize} rounded-full flex items-center justify-center transition-all duration-300 ${
                  filled ? 'shadow-sm' : ''
                }`}
                style={{
                  background: filled ? color : 'transparent',
                  border: `2px solid ${filled ? color : isCurrent ? color : color + '40'}`,
                  transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                {filled && (
                  <span className={`text-white font-bold ${checkSize}`}>✓</span>
                )}
                {isCurrent && !filled && (
                  <span
                    className={`rounded-full w-1.5 h-1.5 animate-pulse`}
                    style={{ background: color }}
                  />
                )}
              </div>
              {i < total - 1 && (
                <div
                  className={`${connSize}`}
                  style={{ background: i < current ? color : color + '25' }}
                />
              )}
            </div>
          );
        })}
      </div>
      {showLabels && (
        <p className="text-xs font-medium" style={{ color }}>
          {current} / {total} {current >= total ? '🎉' : ''}
        </p>
      )}
    </div>
  );
}
