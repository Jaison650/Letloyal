'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Phone, Key, AlertCircle, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import confetti from 'canvas-confetti';
import { OTP_MAX_ATTEMPTS } from '@/lib/constants';

type Step = 'phone' | 'otp' | 'success' | 'error';
type ErrorCode = 'otp_expired' | 'otp_voided' | 'already_validated' | 'not_found' | '';

interface PendingRedemption {
  customer_name: string;
  reward_description: string;
  campaign_name: string;
  otp_expires_at: string;
  points_redeemed: number;
  redemption_id: string;
  otp_attempt_count: number;
}

export interface DemoHint {
  name: string;
  phone: string;
}

// ── Countdown timer ──────────────────────────────────────────────────────────
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => {
      const rem = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(rem);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins   = Math.floor(seconds / 60);
  const secs   = seconds % 60;
  const urgent = seconds < 120;
  const gone   = seconds === 0;

  return (
    <div className={`inline-flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-full ${
      gone || urgent ? 'bg-red-50 text-status-error animate-pulse' : 'bg-primary-light text-primary'
    }`}>
      <Clock size={14} />
      <span>{gone ? 'Expired' : `${mins}:${String(secs).padStart(2, '0')}`}</span>
    </div>
  );
}

// ── 6-digit OTP box row ───────────────────────────────────────────────────────
function OtpBoxes({
  digits,
  onChange,
  hasError,
}: {
  digits: string[];
  onChange: (digits: string[]) => void;
  hasError: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function handleChange(i: number, raw: string) {
    const val = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    onChange(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.split('').concat(Array(6).fill('')).slice(0, 6);
    onChange(next);
    const focusIdx = Math.min(text.length, 5);
    refs.current[focusIdx]?.focus();
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className={`w-12 h-14 text-center text-2xl font-bold font-jakarta rounded-xl border-2 transition-all outline-none
            ${hasError
              ? 'border-status-error bg-red-50 text-status-error'
              : d
              ? 'border-accent bg-accent/5 text-text-dark'
              : 'border-brand-border bg-white text-text-dark focus:border-accent focus:bg-accent/5'
            }`}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  merchantSlug: string;
  demoHints?: DemoHint[];
}

export default function RedemptionValidator({ merchantSlug, demoHints = [] }: Props) {
  const [step, setStep]           = useState<Step>('phone');
  const [phone, setPhone]         = useState('');
  const [digits, setDigits]       = useState<string[]>(Array(6).fill(''));
  const [pending, setPending]     = useState<PendingRedemption | null>(null);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [errorCode, setErrorCode] = useState<ErrorCode>('');
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);
  const [successData, setSuccessData]   = useState<{ name: string; reward: string } | null>(null);
  const [checkVisible, setCheckVisible] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'success') {
      requestAnimationFrame(() => setCheckVisible(true));
    } else {
      setCheckVisible(false);
    }
  }, [step]);

  const reset = useCallback(() => {
    setStep('phone');
    setPhone('');
    setDigits(Array(6).fill(''));
    setPending(null);
    setErrorMsg('');
    setErrorCode('');
    setAttemptsLeft(OTP_MAX_ATTEMPTS);
    setSuccessData(null);
    setTimeout(() => phoneRef.current?.focus(), 50);
  }, []);

  async function lookupCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setErrorCode('');
    try {
      const res  = await fetch(`/api/redemption/pending?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'No pending redemption found for this number.');
        return;
      }
      setPending(data);
      setAttemptsLeft(OTP_MAX_ATTEMPTS - (data.otp_attempt_count || 0));
      setStep('otp');
    } finally {
      setLoading(false);
    }
  }

  async function validateOTP(e: React.FormEvent) {
    e.preventDefault();
    const otpStr = digits.join('');
    if (otpStr.length < 6 || !pending) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res  = await fetch('/api/redemption/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone_number: phone.trim(), otp_input: otpStr }),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data.code as ErrorCode;
        if (code === 'otp_voided' || code === 'otp_expired') {
          setErrorCode(code);
          setErrorMsg(data.error || '');
          setStep('error');
        } else {
          setErrorMsg(data.error || 'Incorrect code.');
          if (data.attempts_remaining !== undefined) setAttemptsLeft(data.attempts_remaining);
          setDigits(Array(6).fill(''));
        }
        return;
      }

      setSuccessData({ name: data.customer_name, reward: data.reward_description });
      setStep('success');
      confetti({
        particleCount: 120,
        spread:        70,
        origin:        { y: 0.6 },
        colors:        ['#5EEAD4', '#0D9488', '#CCFBF1', '#FFFFFF'],
      });
    } finally {
      setLoading(false);
    }
  }

  const otpStr = digits.join('');

  return (
    <div className="max-w-[480px] mx-auto space-y-5">

      {/* ── STEP 1: Phone lookup ───────────────────────────────────────── */}
      {step === 'phone' && (
        <>
          <form onSubmit={lookupCustomer} className="card space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={26} className="text-primary" />
              </div>
              <h2 className="font-jakarta font-bold text-xl">Validate Customer Reward</h2>
              <p className="text-sm text-text-medium mt-1">Enter the customer&apos;s phone number to find their pending reward</p>
            </div>

            <div className="space-y-2">
              <label className="form-label" htmlFor="phone-lookup">Customer Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  id="phone-lookup"
                  ref={phoneRef}
                  type="tel"
                  inputMode="tel"
                  placeholder="+371 2000 0000"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrorMsg(''); }}
                  autoFocus
                  className={`form-input pl-11 h-14 text-base ${errorMsg ? 'border-status-error' : ''}`}
                  style={{ fontSize: '16px' }}
                />
              </div>
              {errorMsg && (
                <p className="text-xs text-status-error font-medium flex items-center gap-1.5">
                  <XCircle size={13} /> {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full h-14 rounded-2xl bg-accent font-bold text-base text-text-dark flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Looking up…
                </>
              ) : (
                <>Look Up Customer <ChevronRight size={18} /></>
              )}
            </button>
          </form>

          {/* Demo hints */}
          {demoHints.length > 0 && (
            <div className="card space-y-3 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-yellow-700 shrink-0" />
                <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Demo Mode — Quick Fill</p>
              </div>
              <p className="text-xs text-yellow-700">
                These customers currently have a pending reward. Click to auto-fill their phone number.
              </p>
              <div className="space-y-2">
                {demoHints.map((hint, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhone(hint.phone)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-yellow-200 text-sm hover:bg-yellow-50 transition-colors text-left"
                  >
                    <span className="font-semibold text-text-dark">{hint.name}</span>
                    <span className="text-text-light font-mono text-xs">{hint.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── STEP 2: OTP entry ─────────────────────────────────────────── */}
      {step === 'otp' && pending && (
        <form onSubmit={validateOTP} className="card space-y-5">

          {/* Demo note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
            <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              <strong>Demo mode:</strong> In live deployment the OTP is sent to the customer via SMS.
              For this demo, the customer sees it on their screen — ask them to show you the code.
            </p>
          </div>

          {/* Customer info */}
          <div className="bg-primary-light rounded-2xl p-5 space-y-2">
            <p className="text-xs font-semibold text-text-light uppercase tracking-wide">Customer</p>
            <p className="font-jakarta font-bold text-2xl">{pending.customer_name}</p>
            <p className="text-sm text-text-medium">{pending.campaign_name}</p>
            <p className="font-semibold text-primary">{pending.reward_description}</p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-text-light">
                {pending.points_redeemed} pt{pending.points_redeemed !== 1 ? 's' : ''} redeemed
              </span>
              <Countdown expiresAt={pending.otp_expires_at} />
            </div>
          </div>

          {/* 6-digit boxes */}
          <div className="space-y-3">
            <label className="form-label flex items-center gap-2">
              <Key size={14} /> Enter 6-Digit Code
            </label>
            <OtpBoxes digits={digits} onChange={setDigits} hasError={!!errorMsg} />
            {errorMsg && (
              <p className="text-sm text-status-error font-medium text-center">{errorMsg}</p>
            )}
            <p className="text-xs text-text-light text-center">
              {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={reset} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={otpStr.length < 6}
              className="flex-1"
            >
              Validate &amp; Redeem
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 3a: Success ──────────────────────────────────────────── */}
      {step === 'success' && successData && (
        <div className="card text-center space-y-5">
          <div
            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto transition-transform duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ transform: checkVisible ? 'scale(1)' : 'scale(0)' }}
          >
            <CheckCircle2 size={44} className="text-status-success" />
          </div>
          <div>
            <h2 className="font-jakarta font-bold text-2xl text-status-success">✓ Reward Redeemed!</h2>
            <p className="text-lg font-semibold mt-2">{successData.name}</p>
            <p className="text-accent font-bold mt-0.5">{successData.reward}</p>
            <p className="text-xs text-text-light mt-3">
              {new Date().toLocaleString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <Button onClick={reset} fullWidth size="lg">
            Validate Another
          </Button>
        </div>
      )}

      {/* ── STEP 3b: Error states ─────────────────────────────────────── */}
      {step === 'error' && (
        <div className="card text-center space-y-5">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={44} className="text-status-error" />
          </div>

          {errorCode === 'otp_expired' ? (
            <>
              <div>
                <h2 className="font-jakarta font-bold text-xl">Code Expired</h2>
                <p className="text-sm text-text-medium mt-2">
                  The OTP has expired. Ask the customer to open the LetLoyal app and request a new redemption code.
                </p>
              </div>
              <Button onClick={reset} fullWidth>Start Over</Button>
            </>
          ) : errorCode === 'otp_voided' ? (
            <>
              <div>
                <h2 className="font-jakarta font-bold text-xl">Code Locked</h2>
                <p className="text-sm text-text-medium mt-2">
                  The code was voided after too many failed attempts. The customer must open the app and request a new redemption code.
                </p>
              </div>
              <Button onClick={reset} fullWidth>Start Over</Button>
            </>
          ) : (
            <>
              <div>
                <h2 className="font-jakarta font-bold text-xl">Redemption Failed</h2>
                <p className="text-sm text-text-medium mt-2">{errorMsg}</p>
              </div>
              <Button onClick={reset} fullWidth>Start Over</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
