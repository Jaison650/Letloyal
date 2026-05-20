/**
 * PrintableQRCard
 * Rendered into the DOM but invisible at runtime.
 * @media print in globals.css reveals this and hides everything else.
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
  const earnLabel =
    campaignType === 'visit_based'
      ? `Collect ${rewardThreshold} stamps to unlock your reward`
      : `Spend €${rewardThreshold} to unlock your reward`;

  return (
    <div id="printable-qr-card" aria-hidden="true">
      {/* Outer page wrapper — centred, A5-ish */}
      <div className="print-card-page">
        <div className="print-card-wrap">

          {/* Header band */}
          <div className="print-card-header" style={{ background: `linear-gradient(135deg, #012d38, ${brandColor})` }}>
            {/* Logo */}
            <div
              className="print-card-logo"
              dangerouslySetInnerHTML={{ __html: logoSvg }}
            />
            <h1 className="print-card-title">{merchantName}</h1>
            <p className="print-card-subtitle">Loyalty Rewards Program</p>
          </div>

          {/* Body */}
          <div className="print-card-body">
            {/* Reward line */}
            <div className="print-reward-banner" style={{ borderColor: `${brandColor}40`, color: brandColor }}>
              <span className="print-reward-label">Your Reward</span>
              <span className="print-reward-desc">{rewardDescription}</span>
            </div>

            {/* QR */}
            {qrDataUrl && (
              <div className="print-qr-wrap" style={{ borderColor: `${brandColor}30` }}>
                <img src={qrDataUrl} alt="Loyalty QR Code" className="print-qr-img" />
              </div>
            )}

            {/* Earn line */}
            <p className="print-earn-label">{earnLabel}</p>

            {/* How it works */}
            <div className="print-steps">
              <div className="print-step">
                <span className="print-step-num" style={{ background: brandColor }}>1</span>
                <div>
                  <strong>Scan</strong> — Point your phone camera here
                </div>
              </div>
              <div className="print-step">
                <span className="print-step-num" style={{ background: brandColor }}>2</span>
                <div>
                  <strong>Join Free</strong> — Create your account in 60 seconds
                </div>
              </div>
              <div className="print-step">
                <span className="print-step-num" style={{ background: brandColor }}>3</span>
                <div>
                  <strong>Earn &amp; Redeem</strong> — Collect &amp; claim your reward
                </div>
              </div>
            </div>

            {/* URL hint */}
            <p className="print-url">{storeUrl}</p>

            {/* Footer */}
            <div className="print-footer">
              <span>Powered by LetLoyal</span>
              <span style={{ color: brandColor }}>letloyal.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
