import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { getMerchantBySlug, getActiveCampaigns } from '@/lib/merchants';
import { generateSpendQR } from '@/lib/qr';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth) || auth.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount_cents } = await req.json();
    if (!amount_cents || amount_cents <= 0) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }

    const merchant = await getMerchantBySlug(slug);
    if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const campaigns = await getActiveCampaigns(merchant.id);
    const spendCampaign = campaigns.find((c) => c.campaign_type === 'spend_based');
    if (!spendCampaign) {
      return NextResponse.json({ error: 'No active spend-based campaign.' }, { status: 404 });
    }

    const secret = process.env.QR_HMAC_SECRET || 'dev_secret';
    const { dataUrl, expiresAt } = await generateSpendQR(
      slug,
      spendCampaign.id,
      amount_cents,
      secret,
      merchant.brand_color
    );

    return NextResponse.json({ dataUrl, expiresAt, campaignId: spendCampaign.id });
  } catch (err) {
    console.error('Spend QR error:', err);
    return NextResponse.json({ error: 'Failed to generate QR.' }, { status: 500 });
  }
}
