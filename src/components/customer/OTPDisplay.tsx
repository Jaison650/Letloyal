'use client';
import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface OTPDisplayProps {
  otp: string;
  expiresAt: string;
  merchantName: string;
  reward: string;
  onCancel: () => void;
  onRenew?: () => void;
}

export default function OTPDisplay({ otp, expiresAt, merchantName, reward, onCancel, onRenew }: OTPDisplayProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const rem = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(rem);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const mins    = Math.floor(seconds / 60);
  const secs    = seconds % 60;
  const urgent  = seconds < 120;
  const expired = seconds === 0;

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border-2 border-accent/30">
      {/* Header stripe */}
      <div className="bg-gradient-brand px-4 py-3 text-white text-center">
        <p className="text-xs font-semibold text-white/80">Show this code to</p>
        <p className="font-sora font-bold text-base">{merchantName}</p>
        <p className="text-xs text-white/70 mt-0.5 truncate">{reward}</p>
      </div>

      <div className="bg-white px-4 py-4 space-y-3">
        {/* OTP digit boxes */}
        <div className="flex justify-center gap-2">
          {otp.split('').map((digit, i) => (
            <div
              key={i}
              className="w-10 h-12 bg-primary-light rounded-xl flex items-center justify-center text-2xl font-bold font-sora text-primary border-2 border-primary/20 select-none"
            >
              {digit}
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div
          className={`flex items-center justify-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${
            expired
              ? 'bg-red-50 text-status-error'
              : urgent
              ? 'bg-red-50 text-status-error animate-pulse'
              : 'bg-primary-light text-primary'
          }`}
        >
          <Clock size={14} />
          <span>
            {expired ? 'Code Expired' : `Expires in ${mins}:${String(secs).padStart(2, '0')}`}
          </span>
        </div>

        {/* Demo note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex gap-2 items-start">
          <AlertCircle size={12} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            In live production this code is sent via SMS. For this demo, show this screen.
          </p>
        </div>

        {/* Expired — get new code */}
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
