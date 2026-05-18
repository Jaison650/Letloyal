import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { getAllCampaigns, getMerchantBySlug } from '@/lib/merchants';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth) || auth.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await getMerchantBySlug(slug);
    if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const campaigns = await getAllCampaigns(merchant.id);
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error('Campaigns route error:', err);
    return NextResponse.json({ error: 'Failed to load campaigns.' }, { status: 500 });
  }
}
