'use client';
import { useState, useEffect, useCallback } from 'react';
import { Download, Printer, Clock, RefreshCw, Maximize2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import QRKioskOverlay from '@/components/merchant/QRKioskOverlay';
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
    if (!currentQr) return;
    const a = document.createElement('a');
    a.href = currentQr;
    a.download = `letloyal-qr-${merchantSlug}.png`;
    a.click();
  }

  /** Open a self-contained popup window and print from it — works on all browsers */
  function printQR() {
    if (!currentQr) return;

    const storeUrl = `${window.location.origin}/store/${merchantSlug}`;
    const earnLine = campaignType === 'visit_based'
      ? `Visit ${rewardThreshold}× → get your reward`
      : `Spend €${rewardThreshold} → get your reward`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${merchantName} – Loyalty QR</title>
  <style>
    @page { size: 80mm auto; margin: 3mm 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      width: 72mm;
      color: #111;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2px solid ${brandColor};
      padding-bottom: 4mm;
      margin-bottom: 3mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .shop { font-size: 15pt; font-weight: 800; margin-bottom: 1mm; line-height: 1.2; }
    .tag { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.08em; color: #666; }
    .reward {
      font-size: 11pt; font-weight: 700; margin-bottom: 4mm; line-height: 1.3;
      color: ${brandColor};
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .qr-box {
      border: 1.5px solid ${brandColor};
      border-radius: 3mm; padding: 2mm;
      display: inline-block; margin-bottom: 3mm;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .qr { width: 54mm; height: 54mm; border-radius: 2mm; display: block; }
    .earn { font-size: 8.5pt; font-weight: 600; color: #333; margin-bottom: 4mm; }
    .steps {
      text-align: left; border-top: 1px dashed #bbb;
      padding-top: 3mm; margin-bottom: 3mm;
      display: flex; flex-direction: column; gap: 2.5mm;
    }
    .step { display: flex; align-items: center; gap: 2.5mm; font-size: 8pt; color: #333; }
    .dot {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 4.5mm; height: 4.5mm; border-radius: 50%;
      font-size: 6.5pt; font-weight: 800; color: #fff;
      background: ${brandColor};
      flex-shrink: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .footer { border-top: 1px dashed #bbb; padding-top: 2.5mm; }
    .url { font-size: 7pt; color: #555; word-break: break-all; margin-bottom: 1mm; }
    .powered { font-size: 6.5pt; color: #aaa; }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop">${merchantName}</div>
    <div class="tag">Loyalty Rewards Program</div>
  </div>
  <div class="reward">&#127873; ${rewardDescription}</div>
  <div class="qr-box">
    <img class="qr" src="${currentQr}" alt="Loyalty QR Code" />
  </div>
  <div class="earn">${earnLine}</div>
  <div class="steps">
    <div class="step"><span class="dot">1</span><span>Scan QR with your phone camera</span></div>
    <div class="step"><span class="dot">2</span><span>Create free account in 60 seconds</span></div>
    <div class="step"><span class="dot">3</span><span>Earn &amp; redeem your reward</span></div>
  </div>
  <div class="footer">
    <div class="url">${storeUrl}</div>
    <div class="powered">Powered by LetLoyal</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=420,height=700,toolbar=0,scrollbars=0');
    if (!win) { alert('Please allow pop-ups for this site to use Print Kit.'); return; }
    win.document.write(html);
    win.document.close();
  }

  const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const isExpiringSoon = countdown > 0 && countdown < 60;

  return (
    <>
      {/* ── Kiosk overlay ── */}
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

      {/* ── Dashboard QR card ── */}
      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-sora font-bold text-lg">Your Loyalty QR Code</h3>
          <div className="flex items-center gap-2">
            {currentQr && (
              <button
                onClick={() => setKioskOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-border text-text-medium hover:bg-brand-bg transition-colors"
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

          {campaignType === 'spend_based' && countdown > 0 && (
            <div className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full ${isExpiringSoon ? 'bg-red-50 text-status-error' : 'bg-primary-light text-primary'}`}>
              <Clock size={15} />
              <span>Expires in {formatCountdown(countdown)}</span>
            </div>
          )}
        </div>

        {/* Spend dial */}
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
          >
            <Download size={16} /> Download PNG
          </button>
          <button
            onClick={printQR}
            disabled={!currentQr}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-text-medium hover:bg-brand-bg disabled:opacity-40 transition-colors min-h-[44px]"
          >
            <Printer size={16} /> Print Kit
          </button>
        </div>
      </div>
    </>
  );
}
