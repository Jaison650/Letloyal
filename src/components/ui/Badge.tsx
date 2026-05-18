import { clsx } from 'clsx';

type BadgeVariant = 'active' | 'paused' | 'ended' | 'unlocked' | 'visit' | 'spend' | 'demo' | 'pro';

const styles: Record<BadgeVariant, string> = {
  active: 'bg-green-50 text-status-success',
  paused: 'bg-orange-50 text-status-warning',
  ended: 'bg-gray-100 text-text-light',
  unlocked: 'bg-accent/15 text-primary',
  visit: 'bg-primary-light text-primary',
  spend: 'bg-purple-50 text-purple-700',
  demo: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  pro: 'bg-primary-light text-primary-dark',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'active', children, className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold', styles[variant], className)}>
      {children}
    </span>
  );
}
