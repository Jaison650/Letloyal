// Legacy route — kept for backwards compatibility.
// New callers should use POST /api/merchant/login instead.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMerchantWithAuth } from '@/lib/merchants';
import { comparePassword, signToken, cookieOptions, MERCHANT_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Accept both old { email } and new { slug } payloads
    const body = await req.json();
    const rawSlug: string = body.slug ?? body.email?.replace('@letloyal.com', '') ?? '';

    if (!rawSlug || !body.password) {
      return NextResponse.json({ error: 'Store and password are required.' }, { status: 400 });
    }

    const merchant = await getMerchantWithAuth(rawSlug.trim().toLowerCase());
    if (!merchant) {
      return NextResponse.json({ error: 'No merchant account found.' }, { status: 401 });
    }

    const valid = await comparePassword(body.password, merchant.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = signToken({ sub: merchant.id, type: 'merchant', slug: merchant.slug, plan: merchant.plan_tier });
    const cookieStore = await cookies();
    const opts = cookieOptions(MERCHANT_COOKIE_NAME);
    cookieStore.set(opts.name, token, opts);

    return NextResponse.json({ success: true, slug: merchant.slug });
  } catch (err) {
    console.error('Merchant login error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
