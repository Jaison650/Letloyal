'use client';
import { useState, useEffect } from 'react';
import { X, Gift, Smartphone, UserCheck, Trophy, ShieldCheck } from 'lucide-react';
import MilestoneSteps from '@/components/ui/MilestoneSteps';
import OfferRules from '@/components/ui/OfferRules';

interface QRKioskOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  merchantName: string;
  merchantSlug: string;
  campaignId: string;
  logoSvg: string;
  brandColor: string;
  rewardDescription: string;
  campaignType: 'visit_based' | 'spend_based';
  rewardThreshold: number;
}

const HOW_IT_WORKS = [
  {
    icon: Smartphone,
    title: 'Scan the QR Code',
    desc: 'Point your phone camera at this code — no app needed.',
  },
  {
    icon: UserCheck,
    title: 'Join for Free',
    desc: 'Create your loyalty account in under 60 seconds.',
  },
  {
    icon: Trophy,
    title: 'Earn & Redeem',
    desc: 'Collect stamps or points and claim your reward automatically.',
  },
];

export default function QRKioskOverlay({
  isOpen, onClose, qrDataUrl, merchantName, merchantSlug, campaignId,
  logoSvg, brandColor, rewardDescription, campaignType, rewardThreshold,
}: QRKioskOverlayProps) {
  const [rules, setRules] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !campaignId) return;
    fetch(`/api/merchants/${merchantSlug}/campaigns/${campaignId}/rules`)
      .then(r => r.json())
      .then(data => {
        const items = data?.rules?.items;
        if (Array.isArray(items)) setRules(items);
      })
      .catch(() => {/* silent — rules optional */});
  }, [isOpen, merchantSlug, campaignId]);

  if (!isOpen) return null;

  const unit      = campaignType === 'visit_based' ? 'visit' : 'point';
  const showSteps = rewardThreshold <= 12;
  const earnLabel = campaignType === 'visit_based'
    ? `Visit ${rewardThreshold} times to earn your reward`
    : `Spend €${rewardThreshold} to earn your reward`;

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel — full height on mobile, max-width card on desktop */}
      <div
        className="relative w-full md:max-w-sm md:mx-4 md:rounded-3xl md:max-h-[92dvh] bg-white flex flex-col overflow-hidden shadow-2xl animate-slide-up"
      >
        {/* ── Branded header ── */}
        <div
          className="px-6 pt-10 pb-7 text-white text-center shrink-0 relative"
          style={{ background: `linear-gradient(145deg, ${brandColor}dd 0%, ${brandColor} 100%)` }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/20 hover:bg-white/35 transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-white" />
          </button>

          {/* Logo */}
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-3 overflow-hidden flex items-center justify-center bg-white/25"
            dangerouslySetInnerHTML={{ __html: logoSvg }}
          />

          <h2 className="font-sora font-bold text-xl leading-tight">{merchantName}</h2>
          <p className="text-white/80 text-xs mt-1 font-medium uppercase tracking-widest">Loyalty Rewards Program</p>

          {/* Reward pill */}
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-2xl px-4 py-2.5 text-left max-w-xs">
            <Gift size={16} className="text-white shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wide">Earn this reward</p>
              <p className="font-sora font-bold text-sm text-white leading-tight">{rewardDescription}</p>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-6 py-6 space-y-7">

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div
                className="rounded-2xl p-3.5"
                style={{ background: `${brandColor}0c`, border: `2px solid ${brandColor}28` }}
              >
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Loyalty QR Code"
                    className="w-52 h-52 rounded-xl block"
                  />
                ) : (
                  <div className="w-52 h-52 rounded-xl bg-brand-bg flex items-center justify-center text-text-light">
                    <p className="text-sm">No active QR</p>
                  </div>
                )}
              </div>

              {/* Progress indicator */}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-text-medium">
                <Trophy size={13} style={{ color: brandColor }} />
                <span>{earnLabel}</span>
              </div>

              {showSteps && (
                <div className="mt-3 w-full flex justify-center">
                  <MilestoneSteps
                    current={0}
                    total={rewardThreshold}
                    color={brandColor}
                    size="md"
                  />
                </div>
              )}

              {/* Scan CTA pill */}
              <div
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                style={{ background: `${brandColor}18`, color: brandColor }}
              >
                <Smartphone size={15} />
                Scan to join &amp; earn {unit}s — it&apos;s free!
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-brand-border" />
              <span className="text-[10px] font-bold text-text-light uppercase tracking-widest">How It Works</span>
              <div className="flex-1 h-px bg-brand-border" />
            </div>

            {/* How It Works steps */}
            <div className="space-y-3">
              {HOW_IT_WORKS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${brandColor}18` }}
                    >
                      <Icon size={17} style={{ color: brandColor }} />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ background: brandColor }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm font-semibold text-text-dark">{step.title}</p>
                      </div>
                      <p className="text-xs text-text-medium mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Offer rules */}
            {rules.length > 0 && (
              <OfferRules
                rules={rules}
                mode="accordion"
                color={brandColor}
                title="Terms &amp; Conditions"
              />
            )}

            {/* Footer */}
            <div className="text-center space-y-1 pb-2">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-light">
                <ShieldCheck size={11} />
                <span>Secure · No credit card required · Cancel anytime</span>
              </div>
              <p className="text-[10px] text-text-light">Powered by <strong className="text-primary">LetLoyal</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
