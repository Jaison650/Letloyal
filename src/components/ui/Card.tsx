import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-brand-border shadow-card',
        hover && 'transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
