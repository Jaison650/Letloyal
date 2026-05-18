import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { withTransaction } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { redemption_id } = await req.json();
    if (!redemption_id) {
      return NextResponse.json({ error: 'Redemption ID required.' }, { status: 400 });
    }

    await withTransaction(async (client) => {
      const result = await client.query(
        `SELECT id, enrollment_id FROM redemptions
         WHERE id = ? AND customer_id = ? AND status = 'pending_otp'`,
        [redemption_id, auth.sub]
      );
      if (!result.rows[0]) return;

      const { enrollment_id } = result.rows[0];
      await client.query(
        `UPDATE redemptions SET status = 'voided' WHERE id = ?`,
        [redemption_id]
      );
      await client.query(
        `UPDATE enrollments SET status = 'reward_unlocked' WHERE id = ?`,
        [enrollment_id]
      );
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel redemption error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
