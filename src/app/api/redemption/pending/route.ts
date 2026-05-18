import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth)) {
      return NextResponse.json({ error: 'Merchant authentication required.' }, { status: 401 });
    }

    const phone = req.nextUrl.searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required.' }, { status: 400 });
    }

    const phoneClean = phone.replace(/\s/g, '');

    const customer = await queryOne<{ id: string; first_name: string; last_name: string }>(
      'SELECT id, first_name, last_name FROM customers WHERE phone_number = ?',
      [phoneClean]
    );

    if (!customer) {
      return NextResponse.json({ error: 'no_pending_redemption', message: 'No customer found with that phone number.' }, { status: 404 });
    }

    const redemption = await queryOne<{
      id: string;
      otp_expires_at: string;
      otp_attempt_count: number;
      points_redeemed: number;
      reward_description: string;
      campaign_name: string;
    }>(
      `SELECT r.id, r.otp_expires_at, r.otp_attempt_count, r.points_redeemed,
              c.reward_description, c.name as campaign_name
       FROM redemptions r
       JOIN campaigns c ON c.id = r.campaign_id
       WHERE r.customer_id = ? AND r.merchant_id = ? AND r.status = 'pending_otp'
       ORDER BY r.created_at DESC LIMIT 1`,
      [customer.id, auth.sub]
    );

    if (!redemption) {
      return NextResponse.json({ error: 'no_pending_redemption', message: 'No pending redemption found for this customer.' }, { status: 404 });
    }

    if (new Date() > new Date(redemption.otp_expires_at)) {
      return NextResponse.json({ error: 'otp_expired', message: 'OTP has expired. Ask the customer to request a new code.' }, { status: 422 });
    }

    return NextResponse.json({
      customer_name:      `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
      reward_description: redemption.reward_description,
      campaign_name:      redemption.campaign_name,
      otp_expires_at:     redemption.otp_expires_at,
      points_redeemed:    redemption.points_redeemed,
      redemption_id:      redemption.id,
      otp_attempt_count:  redemption.otp_attempt_count,
    });
  } catch (err) {
    console.error('Pending redemption lookup error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
