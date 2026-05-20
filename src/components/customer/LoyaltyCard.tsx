'use client';
import { useState } from 'react';
import { Star, Gift, X } from 'lucide-react';
import { clsx } from 'clsx';
import confetti from 'canvas-confetti';
import ProgressBar from '@/components/ui/ProgressBar';
import OTPDisplay from './OTPDisplay';

export interface PendingOtp {
  redemption_id: string;
  otp_code: string;
  expires_at: string;
  reward_description: string;
  merchant_name: string;
}

export interface Enrollment {
  enrollment_id: string;
  merchant_slug: string;
  merchant_name: string;
  merchant_logo_svg: string;
  merchant_brand_color: string;
  merchant_category: string;
  campaign_name: string;
  campaign_type: 'visit_based' | 'spend_based';
  reward_description: string;
  visit_count: number;
  points_balance: number;
  reward_threshold: number;
  status: string;
  progress_pct: number;
  cycle_number: number;
  enrolled_at: string;
  last_activity_at: string;
  pending_otp: PendingOtp | null;
}

export default function LoyaltyCard({ enrollment }: { enrollment: Enrollment }) {
  const [localStatus, setLocalStatus] = useState(enrollment.status);
  const [otpData, setOtpData]         = useState<PendingOtp | null>(
    enrollment.status === 'otp_pending' ? enrollment.pending_otp : null
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const isUnlocked = localStatus === 'reward_unlocked';
  const isPending  = localStatus === 'otp_pending';
  const color      = enrollment.merchant_brand_color;

  const current   = enrollment.campaign_type === 'visit_based'
    ? enrollment.visit_count
    : enrollment.points_balance;
  const remaining = Math.max(0, enrollment.reward_threshold - current);
  const unit      = enrollment.campaign_type === 'visit_based' ? 'visit' : 'point';
  const pct       = Math.min(100, enrollment.progress_pct ?? Math.round((current / enrollment.reward_threshold) * 100));

  async function confirmRedeem() {
    setLoading(true);
    setError('');
    setShowConfirm(false);
    try {
      const res  = await fetch('/api/redemption/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enrollment_id: enrollment.enrollment_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      setOtpData(data);
      setLocalStatus('otp_pending');
      confetti({
        particleCount: 80,
        spread:        60,
        origin:        { y: 0.6 },
        colors:        ['#5EEAD4', '#0D9488', '#CCFBF1', '#FFFFFF'],
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!otpData) return;
    await fetch('/api/redemption/initiate', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ redemption_id: otpData.redemption_id }),
    });
    setOtpData(null);
    setLocalStatus('reward_unlocked');
  }

  return (
    <>
      <div
        className={clsx(
          'bg-white rounded-xl border-2 overflow-hidden transition-all duration-300',
          (isUnlocked || isPending) ? 'shadow-lg' : 'border-brand-border shadow-card'
        )}
        style={
          isUnlocked || isPending
            ? { borderColor: color, boxShadow: `0 0 20px ${color}30` }
            : undefined
        }
      >
        {/* Card header */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: `${color}12` }}
        >
          <div
            className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: `${color}20` }}
            dangerouslySetInnerHTML={{ __html: enrollment.merchant_logo_svg }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-jakarta font-semibold text-base truncate">{enrollment.merchant_name}</p>
            <p className="text-xs text-text-light capitalize">{enrollment.merchant_category}</p>
          </div>
          {/* Cycle badge */}
          {enrollment.cycle_number > 1 && (
            <span className="text-xs font-semibold text-text-light bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full shrink-0">
              ×{enrollment.cycle_number}
            </span>
          )}
          {/* Unlocked star */}
          {(isUnlocked || isPending) && (
            <Star
              size={20}
              fill={color}
              stroke={color}
              className="shrink-0 animate-pulse"
            />
          )}
        </div>

        {/* Card body */}
        <div className="px-5 py-4 space-y-4">
          {/* Reward headline */}
          <div className="flex items-start gap-2">
            <Gift size={15} className="text-accent shrink-0 mt-0.5" />
            <p className="font-jakarta font-bold text-base text-text-dark leading-snug">
              {enrollment.reward_description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <ProgressBar value={pct} />
            <div className="flex justify-between text-xs font-medium">
              <span className="text-text-medium">
                {current} / {enrollment.reward_threshold} {unit}s
              </span>
              <span style={{ color }} className="font-semibold">
                {isUnlocked || isPending
                  ? '🎉 Reward ready!'
                  : `${remaining} more ${unit}${remaining !== 1 ? 's' : ''} to go`}
              </span>
            </div>
          </div>

          {/* Reward-ready badge */}
          {(isUnlocked || isPending) && (
            <div
              className="text-center py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: color }}
            >
              🎉 Reward Ready!
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-status-error text-center font-medium">{error}</p>
          )}

          {/* Inline OTP display */}
          {isPending && otpData && (
            <OTPDisplay
              redemptionId={otpData.redemption_id}
              otp={otpData.otp_code}
              expiresAt={otpData.expires_at}
              merchantName={enrollment.merchant_name}
              reward={enrollment.reward_description}
              onCancel={handleCancel}
              onRenew={async () => { setOtpData(null); await confirmRedeem(); }}
              onSuccess={() => { setOtpData(null); setLocalStatus('active'); }}
            />
          )}

          {/* OTP pending but no local data — allow re-fetch */}
          {isPending && !otpData && (
            <button
              onClick={() => { setLocalStatus('reward_unlocked'); setShowConfirm(true); }}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 min-h-[44px]"
              style={{ background: color }}
            >
              Show My Code
            </button>
          )}

          {/* Redeem button — only when fully unlocked and no OTP shown */}
          {isUnlocked && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-95 min-h-[44px] animate-pulse"
              style={{ background: color }}
            >
              {loading ? 'Loading…' : <><Gift size={15} /> Redeem Now →</>}
            </button>
          )}

          {/* Greyed button when still earning */}
          {!isUnlocked && !isPending && (
            <button
              disabled
              className="w-full py-3 rounded-xl font-bold text-sm text-text-light bg-brand-border flex items-center justify-center gap-2 cursor-not-allowed min-h-[44px]"
            >
              <Gift size={15} /> Redeem Now
            </button>
          )}
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-5 animate-slide-up">
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-brand-bg text-text-light"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-3">
              <p className="text-4xl">🎁</p>
              <h3 className="font-jakarta font-bold text-xl">Confirm Redemption</h3>
              <p className="text-text-medium text-sm">
                Redeem your reward at{' '}
                <strong>{enrollment.merchant_name}</strong>?
              </p>
              <div
                className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: color }}
              >
                {enrollment.reward_description}
              </div>
              <p className="text-xs text-text-light">
                A one-time 6-digit code will appear — show it to the merchant.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-brand-border text-sm font-semibold text-text-medium hover:bg-brand-bg transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmRedeem}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 min-h-[44px]"
                style={{ background: color }}
              >
                {loading ? 'Loading…' : 'Get My Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
