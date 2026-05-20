import QRCode from 'qrcode';
import crypto from 'crypto';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://letloyal.com';
const QR_SPEND_EXPIRY = Number(process.env.QR_SPEND_EXPIRY_SECONDS) || 300;

export async function generateVisitQR(merchantSlug: string, campaignId: string, brandColor = '#0D9488'): Promise<string> {
  const url = `${BASE_URL}/store/${merchantSlug}?c=${campaignId}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: {
      dark: brandColor,
      light: '#FFFFFF',
    },
  });
}

export async function generateSpendQR(
  merchantSlug: string,
  campaignId: string,
  amountCents: number,
  secret: string,
  brandColor = '#0D9488'
): Promise<{ dataUrl: string; expiresAt: number }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = hmacSign(campaignId, amountCents, timestamp, secret);
  const url = `${BASE_URL}/store/${merchantSlug}?c=${campaignId}&a=${amountCents}&ts=${timestamp}&sig=${sig}`;

  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: { dark: brandColor, light: '#FFFFFF' },
  });

  return { dataUrl, expiresAt: timestamp + QR_SPEND_EXPIRY };
}

export function verifySpendQR(
  campaignId: string,
  amountCents: number,
  timestamp: number,
  sig: string,
  secret: string
): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > QR_SPEND_EXPIRY) return false;
  const expected = hmacSign(campaignId, amountCents, timestamp, secret);
  return expected === sig;
}

function hmacSign(campaignId: string, amountCents: number, timestamp: number, secret: string): string {
  const payload = `${campaignId}:${amountCents}:${timestamp}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16);
}
