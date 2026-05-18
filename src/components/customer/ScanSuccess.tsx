'use client';
import { useEffect } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ProgressBar from '@/components/ui/ProgressBar';
import confetti from 'canvas-confetti';

interface ScanSuccessProps {
  merchantName: string;
  merchantColor: string;
  rewardDescription: string;
  pointsAdded: number;
  newTotal: number;
  threshold: number;
  rewardUnlocked: boolean;
  campaignType: 'visit_based' | 'spend_based';
}

export default function ScanSuccess({
  merchantName, merchantColor, rewardDescription,
  pointsAdded, newTotal, threshold, rewardUnlocked, campaignType,
}: ScanSuccessProps) {
  const remaining = Math.max(0, threshold - newTotal);
  const pct = Math.min(100, Math.round((newTotal / threshold) * 100));

  useEffect(() => {
    if (rewardUnlocked) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#02C39A', '#028090', '#05FFCE', '#FFFFFF'] });
    }
  }, [rewardUnlocked]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center bg-brand-bg">
      <div className="w-full max-w-sm space-y-6 animate-slide-up">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
          style={{ background: `${merchantColor}20` }}
        >
          <CheckCircle2 size={44} style={{ color: merchantColor }} />
        </div>

        {/* Title */}
        <div>
          <h1 className="font-sora font-bold text-2xl">
            {rewardUnlocked ? '🎉 Reward Unlocked!' : '✓ Visit Recorded!'}
          </h1>
          <p className="text-text-medium mt-1">
            {campaignType === 'visit_based'
              ? `You've visited ${newTotal} time${newTotal !== 1 ? 's' : ''}.`
              : `You now have ${newTotal} points.`}
          </p>
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card space-y-3">
          <p className="font-semibold text-sm">{merchantName}</p>
          <ProgressBar value={pct} />
          <div className="flex justify-between text-xs text-text-medium font-medium">
            <span>{newTotal} / {threshold} {campaignType === 'visit_based' ? 'visits' : 'points'}</span>
            <span style={{ color: merchantColor }}>
              {rewardUnlocked ? '🎁 Ready to redeem!' : `${remaining} more to go`}
            </span>
          </div>
          <p className="text-xs text-text-light border-t border-brand-border pt-2 mt-1">{rewardDescription}</p>
        </div>

        {rewardUnlocked && (
          <div
            className="rounded-2xl p-4 text-white text-center font-semibold"
            style={{ background: merchantColor }}
          >
            🏆 Your reward is ready! Open your loyalty card to redeem.
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="btn-primary w-full justify-center">
            View My Dashboard <ChevronRight size={16} />
          </Link>
          <button onClick={() => window.history.back()} className="btn-ghost text-sm text-text-medium">
            Stay Here
          </button>
        </div>
      </div>
    </div>
  );
}
