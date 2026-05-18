import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { generateOTP, getOTPExpiry } from '@/lib/otp';

function toMysqlDatetime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Please sign in to redeem rewards.' }, { status: 401 });
    }

    const { enrollment_id } = await req.json();
    if (!enrollment_id) {
      return NextResponse.json({ error: 'Enrollment ID required.' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      const enrollment = await client.query(
        `SELECT e.*, c.reward_description, c.reward_threshold, c.name AS campaign_name,
                c.campaign_type, m.business_name AS merchant_name
           FROM enrollments e
           JOIN campaigns c ON c.id = e.campaign_id
           JOIN merchants  m ON m.id = e.merchant_id
          WHERE e.id = ? AND e.customer_id = ?`,
        [enrollment_id, auth.sub]
      );

      if (!enrollment.rows[0]) {
        throw { code: 'not_found', status: 404, message: 'Enrollment not found.' };
      }

      const e = enrollment.rows[0];

      if (e.status !== 'reward_unlocked') {
        throw { code: 'not_unlocked', status: 422, message: 'Your reward is not yet unlocked.' };
      }

      // Void any existing pending OTP for this enrollment
      await client.query(
        `UPDATE redemptions SET status = 'voided' WHERE enrollment_id = ? AND status = 'pending_otp'`,
        [enrollment_id]
      );

      const otp        = generateOTP();
      const expiresAt  = getOTPExpiry();
      const redemptionId = randomUUID();

      await client.query(
        `INSERT INTO redemptions
           (id, enrollment_id, customer_id, campaign_id, merchant_id,
            status, otp_code, otp_expires_at, cycle_number, points_redeemed)
         VALUES (?, ?, ?, ?, ?, 'pending_otp', ?, ?, ?, ?)`,
        [
          redemptionId, enrollment_id, auth.sub,
          e.campaign_id, e.merchant_id,
          otp, toMysqlDatetime(expiresAt),
          e.cycle_number, e.points_balance,
        ]
      );

      await client.query(
        `UPDATE enrollments SET status = 'otp_pending' WHERE id = ?`,
        [enrollment_id]
      );

      return {
        otp_code:          otp,
        expires_at:        expiresAt.toISOString(),
        redemption_id:     redemptionId,
        reward_description: e.reward_description,
        merchant_name:     e.merchant_name,
      };
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { code?: string; status?: number; message?: string };
    if (e.code && e.status) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Redemption initiate error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { redemption_id } = await req.json();

    await withTransaction(async (client) => {
      const redemption = await client.query(
        `SELECT r.*, e.id AS enrollment_id
           FROM redemptions r
           JOIN enrollments e ON e.id = r.enrollment_id
          WHERE r.id = ? AND r.customer_id = ? AND r.status = 'pending_otp'`,
        [redemption_id, auth.sub]
      );

      if (!redemption.rows[0]) return;

      await client.query(
        `UPDATE redemptions SET status = 'voided' WHERE id = ?`,
        [redemption_id]
      );
      await client.query(
        `UPDATE enrollments SET status = 'reward_unlocked' WHERE id = ?`,
        [redemption.rows[0].enrollment_id]
      );
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel redemption error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
