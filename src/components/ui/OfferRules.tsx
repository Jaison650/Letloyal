'use client';
import { useState } from 'react';
import { ChevronDown, ShieldCheck } from 'lucide-react';

interface OfferRulesProps {
  rules: string[];
  mode?: 'accordion' | 'static';
  color?: string;
  title?: string;
}

export default function OfferRules({
  rules,
  mode = 'accordion',
  color = '#028090',
  title = 'Offer Terms & Conditions',
}: OfferRulesProps) {
  const [open, setOpen] = useState(false);

  if (!rules || rules.length === 0) return null;

  if (mode === 'static') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={15} style={{ color }} />
          <p className="text-xs font-bold text-text-medium uppercase tracking-wide">{title}</p>
        </div>
        <ul className="space-y-1.5">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text-medium leading-relaxed">
              <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                style={{ background: color + '80' }}>
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Accordion mode
  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-bg hover:bg-white transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color }} />
          <span className="text-xs font-semibold text-text-medium">{title}</span>
        </div>
        <ChevronDown
          size={14}
          className="text-text-light transition-transform duration-200 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="px-4 py-3 bg-white border-t border-brand-border">
          <ul className="space-y-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-medium leading-relaxed">
                <span
                  className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white mt-0.5"
                  style={{ background: color + '90' }}
                >
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
