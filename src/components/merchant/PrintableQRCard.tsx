/**
 * PrintableQRCard
 * Invisible at runtime — revealed by @media print in globals.css.
 * Designed for 80mm thermal receipt printers.
 */

interface PrintableQRCardProps {
  merchantName: string;
  brandColor: string;
  logoSvg: string;
  rewardDescription: string;
  campaignType: 'visit_based' | 'spend_based';
  rewardThreshold: number;
  qrDataUrl: string | undefined;
  storeUrl: string;
}

export default function PrintableQRCard({
  merchantName,
  brandColor,
  logoSvg,
  rewardDescription,
  campaignType,
  rewardThreshold,
  qrDataUrl,
  storeUrl,
}: PrintableQRCardProps) {
  const earnLine =
    campaignType === 'visit_based'
      ? `Visit ${rewardThreshold}x → get your reward`
      : `Spend €${rewardThreshold} → get your reward`;

  return (
    <div id="printable-qr-card" aria-hidden="true">
      <div className="print-wrap">

        {/* Shop name */}
        <div className="print-header" style={{ borderColor: brandColor }}>
          <div className="print-logo" dangerouslySetInnerHTML={{ __html: logoSvg }} />
          <p className="print-shop-name">{merchantName}</p>
          <p className="print-tag">Loyalty Rewards</p>
        </div>

        {/* Reward */}
        <div className="print-reward" style={{ color: brandColor }}>
          🎁 {rewardDescription}
        </div>

        {/* QR */}
        {qrDataUrl && (
          <div className="print-qr-box" style={{ borderColor: `${brandColor}40` }}>
            <img src={qrDataUrl} alt="QR" className="print-qr" />
          </div>
        )}

        {/* Earn line */}
        <p className="print-earn">{earnLine}</p>

        {/* Steps — ultra-compact */}
        <div className="print-steps">
          <div className="print-step-row">
            <span className="print-step-dot" style={{ background: brandColor }}>1</span>
            <span>Scan QR with your camera</span>
          </div>
          <div className="print-step-row">
            <span className="print-step-dot" style={{ background: brandColor }}>2</span>
            <span>Create free account (60 sec)</span>
          </div>
          <div className="print-step-row">
            <span className="print-step-dot" style={{ background: brandColor }}>3</span>
            <span>Earn &amp; redeem rewards</span>
          </div>
        </div>

        {/* URL + footer */}
        <div className="print-footer">
          <p className="print-url">{storeUrl}</p>
          <p className="print-powered">Powered by LetLoyal</p>
        </div>

      </div>
    </div>
  );
}
