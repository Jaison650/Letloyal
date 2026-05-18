import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { query } from '@/lib/db';

interface HistoryRow {
  id: string;
  created_at: string;
  validated_at: string;
  points_redeemed: number;
  status: string;
  cycle_number: number;
  reward_description: string;
  campaign_name: string;
  merchant_name: string;
  brand_color: string;
  logo_svg: string;
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await query<HistoryRow>(
      `SELECT r.id, r.created_at, r.validated_at, r.points_redeemed,
              r.status, r.cycle_number,
              c.reward_description, c.name as campaign_name,
              m.business_name as merchant_name, m.brand_color, m.logo_svg
       FROM redemptions r
       JOIN campaigns c ON c.id = r.campaign_id
       JOIN merchants  m ON m.id = r.merchant_id
       WHERE r.customer_id = ? AND r.status = 'validated'
       ORDER BY r.validated_at DESC
       LIMIT 50`,
      [auth.sub],
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/customer/history error:', err);
    return NextResponse.json({ error: 'Failed to load history.' }, { status: 500 });
  }
}
