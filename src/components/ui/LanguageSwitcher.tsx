'use client';
import { useTransition } from 'react';
import { useLocale } from 'next-intl';

const FLAG: Record<string, string> = { en: '🇬🇧', lv: '🇱🇻' };
const LABEL: Record<string, string> = { en: 'EN', lv: 'LV' };

export default function LanguageSwitcher({
  className = '',
  variant = 'dark',
}: {
  className?: string;
  variant?: 'dark' | 'light';
}) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      window.location.reload();
    });
  }

  const locales = ['en', 'lv'];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => l !== locale && switchLocale(l)}
          disabled={isPending}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
            variant === 'dark'
              ? l === locale
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
              : l === locale
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-text-light hover:text-primary hover:bg-primary/5'
          }`}
          aria-label={`Switch to ${l.toUpperCase()}`}
        >
          {FLAG[l]} {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
