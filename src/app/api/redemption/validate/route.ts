import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { queryOne, withTransaction } from '@/lib/db';
import { OTP_MAX_ATTEMPTS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth)) {
      return NextResponse.json({ error: 'Merchant authentication required.' }, { status: 401 });
    }

    const { phone_number, otp_input } = await req.json();
    if (!phone_number || !otp_input) {
      return NextResponse.json({ error: 'Phone number and OTP are required.' }, { status: 400 });
    }

    const phoneClean = String(phone_number).replace(/\s/g, '');

    // Step 1: find customer
    const customer = await queryOne<{ id: string; first_name: string }>(
      'SELECT id, first_name FROM customers WHERE phone_number = ?',
      [phoneClean]
    );
    if (!customer) {
      return NextResponse.json({ error: 'No customer found with that phone number.' }, { status: 404 });
    }

    // Step 2: find pending redemption
    const redemption = await queryOne<{
      id: string;
      enrollment_id: string;
      otp_code: string;
      otp_expires_at: string;
      otp_attempt_count: number;
      cycle_number: number;
      points_redeemed: number;
      reward_description: string;
      campaign_name: string;
    }>(
      `SELECT r.id, r.enrollment_id, r.otp_code, r.otp_expires_at, r.otp_attempt_count,
              r.cycle_number, r.points_redeemed, c.reward_description, c.name as campaign_name
       FROM redemptions r
       JOIN campaigns c ON c.id = r.campaign_id
       WHERE r.customer_id = ? AND r.merchant_id = ? AND r.status = 'pending_otp'
       ORDER BY r.created_at DESC LIMIT 1`,
      [customer.id, auth.sub]
    );
    if (!redemption) {
      return NextResponse.json({ error: 'No pending redemption found for this customer.' }, { status: 404 });
    }

    // Step 3: check expiry — update status to 'expired' before returning
    if (new Date() > new Date(redemption.otp_expires_at)) {
      await queryOne(
        `UPDATE redemptions SET status = 'expired' WHERE id = ? AND status = 'pending_otp'`,
        [redemption.id]
      );
      return NextResponse.json(
        { error: 'OTP has expired. Ask the customer to request a new code.', code: 'otp_expired' },
        { status: 422 }
      );
    }

    // Step 4: compare OTP
    if (redemption.otp_code !== String(otp_input).trim()) {
      const newCount = redemption.otp_attempt_count + 1;

      if (newCount >= OTP_MAX_ATTEMPTS) {
        await withTransaction(async (client) => {
          await client.query(
            `UPDATE redemptions SET status = 'voided', otp_attempt_count = ? WHERE id = ?`,
            [newCount, redemption.id]
          );
          await client.query(
            `UPDATE enrollments SET status = 'reward_unlocked' WHERE id = ?`,
            [redemption.enrollment_id]
          );
        });
        return NextResponse.json(
          { error: 'Too many incorrect attempts. The code has been voided. The customer can generate a new code.', code: 'otp_voided' },
          { status: 422 }
        );
      }

      await queryOne(
        `UPDATE redemptions SET otp_attempt_count = ? WHERE id = ?`,
        [newCount, redemption.id]
      );
      return NextResponse.json(
        {
          error: `Wrong code. ${OTP_MAX_ATTEMPTS - newCount} attempt${OTP_MAX_ATTEMPTS - newCount === 1 ? '' : 's'} remaining.`,
          code: 'invalid_otp',
          attempts_remaining: OTP_MAX_ATTEMPTS - newCount,
        },
        { status: 422 }
      );
    }

    // Step 5: execute redemption in transaction
    await withTransaction(async (client) => {
      // a. Mark redemption validated
      await client.query(
        `UPDATE redemptions SET status = 'validated', validated_at = NOW() WHERE id = ?`,
        [redemption.id]
      );

      // b. Compute carry-over and reset enrollment for next cycle
      const enrRows = await client.query(
        `SELECT e.visit_count, e.points_balance, e.campaign_id, e.merchant_id,
                cam.reward_threshold, cam.campaign_type
         FROM enrollments e
         JOIN campaigns cam ON cam.id = e.campaign_id
         WHERE e.id = ?`,
        [redemption.enrollment_id]
      );
      const enr = enrRows.rows[0];
      const threshold      = Number(enr.reward_threshold);
      const isVisitBased   = enr.campaign_type === 'visit_based';
      const carryOverVisits = isVisitBased ? Math.max(0, Number(enr.visit_count) - threshold) : 0;
      const carryOverPts    = isVisitBased ? 0 : Math.max(0, Number(enr.points_balance) - threshold);

      await client.query(
        `UPDATE enrollments SET
           visit_count = ?, points_balance = ?,
           cycle_number = cycle_number + 1, status = 'active', last_activity_at = NOW()
         WHERE id = ?`,
        [carryOverVisits, carryOverPts, redemption.enrollment_id]
      );

      // c. Insert redeem transaction
      await client.query(
        `INSERT INTO point_transactions
           (id, enrollment_id, customer_id, campaign_id, merchant_id, transaction_type, points, cycle_number)
         VALUES (?, ?, ?, ?, ?, 'redeem', ?, ?)`,
        [
          randomUUID(),
          redemption.enrollment_id,
          customer.id,
          enr.campaign_id,
          enr.merchant_id,
          -Math.abs(redemption.points_redeemed || 0),
          redemption.cycle_number,
        ]
      );
    });

    // Step 6: return success
    return NextResponse.json({
      success:      true,
      customer_name:     customer.first_name || 'Customer',
      reward_description: redemption.reward_description,
    });
  } catch (err) {
    console.error('Validate error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
