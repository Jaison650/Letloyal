'use client';
import { useEffect, useState } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OTPDisplayProps {
  redemptionId: string;
  otp: string;
  expiresAt: string;
  merchantName: string;
  reward: string;
  onCancel: () => void;
  onRenew?: () => void;
  onSuccess?: () => void;
}

export default function OTPDisplay({
  redemptionId, otp, expiresAt, merchantName, reward,
  onCancel, onRenew, onSuccess,
}: OTPDisplayProps) {
  const [seconds, setSeconds] = useState(0);
  const [validated, setValidated] = useState(false);

  // Countdown timer
  useEffect(() => {
    const update = () => {
      const rem = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(rem);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Poll redemption status every 4 seconds
  useEffect(() => {
    if (validated) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/redemption/status?id=${redemptionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'validated') {
          setValidated(true);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#5EEAD4', '#0D9488', '#CCFBF1', '#FFFFFF', '#FFD700'],
          });
          setTimeout(() => onSuccess?.(), 2500);
        }
      } catch { /* ignore */ }
    };
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [redemptionId, validated, onSuccess]);

  const mins    = Math.floor(seconds / 60);
  const secs    = seconds % 60;
  const urgent  = seconds < 120;
  const expired = seconds === 0;

  // ── Success screen ───────────────────────────────────────────────────────
  if (validated) {
    return (
      <div className="mt-4 rounded-2xl overflow-hidden border-2 border-accent/50 bg-white">
        <div className="bg-gradient-brand px-4 py-3 text-white text-center">
          <p className="font-jakarta font-bold text-base">{merchantName}</p>
        </div>
        <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center animate-bounce-in">
            <CheckCircle2 size={40} className="text-status-success" />
          </div>
          <h3 className="font-jakarta font-bold text-xl text-status-success">Reward Redeemed! 🎉</h3>
          <p className="text-sm font-semibold text-accent">{reward}</p>
          <p className="text-xs text-text-light">Enjoy your reward. See you next time!</p>
        </div>
      </div>
    );
  }

  // ── OTP screen ───────────────────────────────────────────────────────────
  return (
    <div className="mt-4 rounded-2xl overflow-hidden border-2 border-accent/30">
      <div className="bg-gradient-brand px-4 py-3 text-white text-center">
        <p className="text-xs font-semibold text-white/80">Show this code to</p>
        <p className="font-jakarta font-bold text-base">{merchantName}</p>
        <p className="text-xs text-white/70 mt-0.5 truncate">{reward}</p>
      </div>

      <div className="bg-white px-4 py-4 space-y-3">
        {/* OTP digit boxes */}
        <div className="flex justify-center gap-2">
          {otp.split('').map((digit, i) => (
            <div
              key={i}
              className={`w-10 h-12 rounded-xl flex items-center justify-center text-2xl font-bold font-jakarta border-2 select-none transition-all ${
                expired
                  ? 'bg-red-50 border-red-200 text-status-error opacity-50'
                  : 'bg-primary-light border-primary/20 text-primary'
              }`}
            >
              {digit}
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div className={`flex items-center justify-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${
          expired
            ? 'bg-red-50 text-status-error'
            : urgent
            ? 'bg-red-50 text-status-error animate-pulse'
            : 'bg-primary-light text-primary'
        }`}>
          <Clock size={14} />
          <span>{expired ? 'Code Expired' : `Expires in ${mins}:${String(secs).padStart(2, '0')}`}</span>
        </div>

        {/* Waiting indicator (non-expired) */}
        {!expired && (
          <div className="flex items-center justify-center gap-2 text-xs text-text-light">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" />
            Waiting for merchant to validate…
          </div>
        )}

        {/* Demo note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex gap-2 items-start">
          <AlertCircle size={12} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            In live production this code is sent via SMS. For this demo, show this screen.
          </p>
        </div>

        {/* Get New Code — only when expired */}
        {expired && onRenew && (
          <button
            onClick={onRenew}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-accent flex items-center justify-center gap-2 min-h-[44px] hover:opacity-90 active:scale-95 transition-all"
          >
            Get New Code →
          </button>
        )}

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="w-full text-xs text-text-light hover:text-status-error transition-colors py-1.5 text-center"
        >
          Cancel Redemption
        </button>
      </div>
    </div>
  );
}
