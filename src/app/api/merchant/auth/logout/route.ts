import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MERCHANT_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(MERCHANT_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
