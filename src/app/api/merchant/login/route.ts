import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMerchantWithAuth } from '@/lib/merchants';
import { comparePassword, signToken, cookieOptions, MERCHANT_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { slug, password } = await req.json();

    if (!slug?.trim() || !password) {
      return NextResponse.json({ error: 'Store and password are required.' }, { status: 400 });
    }

    const merchant = await getMerchantWithAuth(slug.trim().toLowerCase());
    if (!merchant) {
      return NextResponse.json({ error: 'No merchant account found for that store.' }, { status: 401 });
    }

    const valid = await comparePassword(password, merchant.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = signToken({
      sub: merchant.id,
      type: 'merchant',
      slug: merchant.slug,
      plan: merchant.plan_tier,
    });

    const cookieStore = await cookies();
    const opts = cookieOptions(MERCHANT_COOKIE_NAME);
    cookieStore.set(opts.name, token, opts);

    return NextResponse.json({ success: true, slug: merchant.slug });
  } catch (err) {
    console.error('Merchant login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
