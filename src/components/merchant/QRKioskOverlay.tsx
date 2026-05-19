'use client';
import { X, Scan, Gift, Trophy } from 'lucide-react';
import MilestoneSteps from '@/components/ui/MilestoneSteps';

interface QRKioskOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  merchantName: string;
  logoSvg: string;
  brandColor: string;
  rewardDescription: string;
  campaignType: 'visit_based' | 'spend_based';
  rewardThreshold: number;
}

export default function QRKioskOverlay({
  isOpen, onClose, qrDataUrl, merchantName, logoSvg,
  brandColor, rewardDescription, campaignType, rewardThreshold,
}: QRKioskOverlayProps) {
  if (!isOpen) return null;

  const unit = campaignType === 'visit_based' ? 'visit' : 'point';
  const showSteps = rewardThreshold <= 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
        style={{ background: '#fff' }}
      >
        {/* Branded header */}
        <div
          className="px-6 pt-8 pb-6 text-white text-center"
          style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>

          {/* Merchant logo */}
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-3 overflow-hidden flex items-center justify-center bg-white/20"
            dangerouslySetInnerHTML={{ __html: logoSvg }}
          />
          <h2 className="font-sora font-bold text-xl leading-tight">{merchantName}</h2>
          <p className="text-white/80 text-xs mt-1 font-medium">Loyalty Rewards Program</p>
        </div>

        {/* QR + offer body */}
        <div className="px-6 py-6 space-y-5 text-center">
          {/* Reward banner */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
            style={{ background: `${brandColor}12`, border: `1.5px solid ${brandColor}30` }}
          >
            <Gift size={20} style={{ color: brandColor }} className="shrink-0" />
            <div>
              <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Your Reward</p>
              <p className="font-sora font-bold text-sm text-text-dark leading-snug">{rewardDescription}</p>
            </div>
          </div>

          {/* QR code */}
          <div
            className="rounded-2xl p-4 inline-block mx-auto"
            style={{ background: `${brandColor}0a`, border: `2px solid ${brandColor}25` }}
          >
            <img
              src={qrDataUrl}
              alt="Loyalty QR Code"
              className="w-52 h-52 rounded-xl"
            />
          </div>

          {/* Milestone info */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Trophy size={14} style={{ color: brandColor }} />
              <p className="text-xs font-semibold text-text-medium">
                {campaignType === 'visit_based'
                  ? `Visit ${rewardThreshold} times to earn your reward`
                  : `Spend €${rewardThreshold} to earn your reward`}
              </p>
            </div>

            {showSteps && (
              <MilestoneSteps
                current={0}
                total={rewardThreshold}
                color={brandColor}
                size="md"
              />
            )}
          </div>

          {/* Scan CTA */}
          <div
            className="flex items-center justify-center gap-2 py-3 rounded-2xl"
            style={{ background: `${brandColor}15` }}
          >
            <Scan size={16} style={{ color: brandColor }} />
            <p className="text-sm font-bold" style={{ color: brandColor }}>
              Scan to join &amp; earn {unit}s
            </p>
          </div>

          {/* Powered by */}
          <p className="text-[10px] text-text-light">Powered by LetLoyal</p>
        </div>
      </div>
    </div>
  );
}
