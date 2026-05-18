'use client';
import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import RedemptionValidator from './RedemptionValidator';

export default function ValidatorFAB({ merchantSlug }: { merchantSlug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile-only FAB */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-accent rounded-full shadow-btn-hover flex items-center justify-center text-text-dark hover:scale-105 transition-transform active:scale-95"
        aria-label="Validate Redemption"
      >
        <CheckCircle2 size={26} />
      </button>

      {/* Bottom sheet modal */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-brand-bg rounded-t-3xl max-h-[92dvh] overflow-y-auto">
            {/* Handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="w-10 h-1 bg-brand-border rounded-full mx-auto" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-3 p-2 rounded-full hover:bg-brand-border text-text-light"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="px-4 pb-8 pt-2">
              <RedemptionValidator merchantSlug={merchantSlug} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
