import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

interface FeedbackRow {
  id: string;
  message: string;
  rating: number | null;
  is_anonymous: boolean;
  created_at: string;
  customer_name: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth) || auth.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await queryOne<{ id: string }>(
      `SELECT id FROM merchants WHERE slug = ?`,
      [slug],
    );
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const rows = await query<FeedbackRow>(
      `SELECT f.id, f.message, f.rating, f.is_anonymous, f.created_at,
              CASE
                WHEN f.customer_id IS NULL OR f.is_anonymous = 1 THEN 'Anonymous'
                ELSE COALESCE(c.first_name, 'Customer')
              END AS customer_name
       FROM feedback f
       LEFT JOIN customers c ON c.id = f.customer_id
       WHERE f.merchant_id = ?
       ORDER BY f.created_at DESC`,
      [merchant.id],
    );

    return NextResponse.json({ feedback: rows });
  } catch (err) {
    console.error('GET /api/merchants/[slug]/feedback error:', err);
    return NextResponse.json({ error: 'Failed to load feedback.' }, { status: 500 });
  }
}
