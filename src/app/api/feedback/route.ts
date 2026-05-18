import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      merchant_id?: string;
      message?: string;
      rating?: number;
      is_anonymous?: boolean;
    };

    const { merchant_id, message, rating, is_anonymous = false } = body;

    if (!merchant_id) {
      return NextResponse.json({ error: 'merchant_id is required' }, { status: 400 });
    }
    if (!message || message.trim().length === 0 || message.trim().length > 500) {
      return NextResponse.json({ error: 'message must be 1–500 characters' }, { status: 400 });
    }

    // Auth is optional — anonymous feedback allowed
    const auth = getAuthFromRequest(req);
    const customerId: string | null =
      auth && isCustomer(auth) && !is_anonymous ? auth.sub : null;

    await query(
      `INSERT INTO feedback (merchant_id, customer_id, message, rating, is_anonymous)
       VALUES (?, ?, ?, ?, ?)`,
      [merchant_id, customerId, message.trim(), rating ?? null, is_anonymous ? 1 : 0],
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/feedback error:', err);
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 500 });
  }
}
