'use client';
import { useState, useEffect, useCallback } from 'react';
import { Download, Printer, Clock, RefreshCw, Maximize2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import QRKioskOverlay from '@/components/merchant/QRKioskOverlay';
import PrintableQRCard from '@/components/merchant/PrintableQRCard';
import { QR_SPEND_EXPIRY_SECONDS } from '@/lib/constants';

interface QRPanelProps {
  merchantSlug: string;
  merchantName: string;
  logoSvg: string;
  campaignType: 'visit_based' | 'spend_based';
  campaignId: string;
  rewardDescription: string;
  rewardThreshold: number;
  brandColor: string;
  staticQrDataUrl: string;
}

const SPEND_AMOUNTS = [500, 1000, 1500, 2000]; // cents

export default function QRPanel({
  merchantSlug, merchantName, logoSvg, campaignType, campaignId, rewardDescription,
  rewardThreshold, brandColor, staticQrDataUrl,
}: QRPanelProps) {
  const [spendQr, setSpendQr] = useState<{ dataUrl: string; expiresAt: number } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [kioskOpen, setKioskOpen] = useState(false);

  const currentQr = campaignType === 'visit_based' ? staticQrDataUrl : spendQr?.dataUrl;

  // Store URL shown on the printed card
  const storeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/store/${merchantSlug}`
      : `letloyal.com/store/${merchantSlug}`;

  useEffect(() => {
    if (!spendQr) return;
    const interval = setInterval(() => {
      const remaining = spendQr.expiresAt - Math.floor(Date.now() / 1000);
      if (remaining <= 0) {
        setSpendQr(null);
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [spendQr]);

  const generateSpendQR = useCallback(async (amountCents: number) => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/merchants/${merchantSlug}/qr/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_cents: amountCents }),
      });
      const data = await res.json();
      if (data.dataUrl) {
        setSpendQr({ dataUrl: data.dataUrl, expiresAt: data.expiresAt });
        setCountdown(QR_SPEND_EXPIRY_SECONDS);
      }
    } finally {
      setGenerating(false);
    }
  }, [merchantSlug]);

  function downloadQR() {
    const qr = currentQr;
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `letloyal-qr-${merchantSlug}.png`;
    a.click();
  }

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const isExpiringSoon = countdown > 0 && countdown < 60;

  return (
    <>
      {/* ── Kiosk overlay — rendered as portal-like sibling ── */}
      <QRKioskOverlay
        isOpen={kioskOpen}
        onClose={() => setKioskOpen(false)}
        qrDataUrl={currentQr ?? ''}
        merchantName={merchantName}
        merchantSlug={merchantSlug}
        campaignId={campaignId}
        logoSvg={logoSvg}
        brandColor={brandColor}
        rewardDescription={rewardDescription}
        campaignType={campaignType}
        rewardThreshold={rewardThreshold}
      />

      {/* ── Print-only card — hidden at runtime, revealed by @media print ── */}
      <PrintableQRCard
        merchantName={merchantName}
        brandColor={brandColor}
        logoSvg={logoSvg}
        rewardDescription={rewardDescription}
        campaignType={campaignType}
        rewardThreshold={rewardThreshold}
        qrDataUrl={currentQr}
        storeUrl={storeUrl}
      />

      {/* ── Dashboard QR card ── */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-sora font-bold text-lg">Your Loyalty QR Code</h3>
          <div className="flex items-center gap-2">
            {currentQr && (
              <button
                onClick={() => setKioskOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-border text-text-medium hover:bg-brand-bg transition-colors"
                title="Show full-screen QR for customers to scan"
              >
                <Maximize2 size={12} /> Kiosk Mode
              </button>
            )}
            {campaignType === 'visit_based' && (
              <span className="text-xs text-text-light bg-brand-bg px-3 py-1 rounded-full border border-brand-border">
                All visits
              </span>
            )}
          </div>
        </div>

        {/* QR Display */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="rounded-2xl p-4 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity relative group"
            style={{ background: `${brandColor}15`, border: `3px solid ${brandColor}30` }}
            onClick={() => currentQr && setKioskOpen(true)}
            title="Click to expand"
          >
            {currentQr && (
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-dark">
                  <Maximize2 size={12} /> Expand
                </div>
              </div>
            )}
            {currentQr ? (
              <img src={currentQr} alt="Loyalty QR Code" className="w-64 h-64 rounded-xl" />
            ) : (
              <div className="w-64 h-64 bg-brand-bg rounded-xl flex flex-col items-center justify-center gap-3 text-text-light">
                <RefreshCw size={32} />
                <p className="text-sm text-center px-4">
                  {campaignType === 'spend_based'
                    ? 'Select a purchase amount below to generate a QR code'
                    : 'Loading QR code...'}
                </p>
              </div>
            )}
          </div>

          <p className="text-sm text-text-medium text-center font-medium">{rewardDescription}</p>

          {/* Countdown for spend QR */}
          {campaignType === 'spend_based' && countdown > 0 && (
            <div className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full ${isExpiringSoon ? 'bg-red-50 text-status-error' : 'bg-primary-light text-primary'}`}>
              <Clock size={15} />
              <span>Expires in {formatCountdown(countdown)}</span>
            </div>
          )}
        </div>

        {/* Spend dial buttons */}
        {campaignType === 'spend_based' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Purchase Amount</p>
            <div className="grid grid-cols-4 gap-2">
              {SPEND_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => generateSpendQR(amt)}
                  disabled={generating}
                  className="py-3 rounded-xl border-2 border-brand-border text-sm font-bold text-text-dark hover:border-primary hover:bg-primary-light transition-all active:scale-95 min-h-[44px]"
                >
                  €{amt / 100}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Custom €"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="form-input flex-1"
                inputMode="decimal"
              />
              <Button
                onClick={() => customAmount && generateSpendQR(Math.round(parseFloat(customAmount) * 100))}
                disabled={!customAmount || generating}
                loading={generating}
                size="sm"
              >
                Generate
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t border-brand-border">
          <button
            onClick={downloadQR}
            disabled={!currentQr}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-text-medium hover:bg-brand-bg disabled:opacity-40 transition-colors min-h-[44px]"
            aria-label="Download QR"
          >
            <Download size={16} /> Download PNG
          </button>
          <button
            onClick={() => window.print()}
            disabled={!currentQr}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-text-medium hover:bg-brand-bg disabled:opacity-40 transition-colors min-h-[44px]"
            aria-label="Print QR Kit"
          >
            <Printer size={16} /> Print Kit
          </button>
        </div>
      </div>
    </>
  );
}
