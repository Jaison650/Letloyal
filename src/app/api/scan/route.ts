import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { queryOne, withTransaction } from '@/lib/db';
import { SCAN_IDEMPOTENCY_WINDOW_SECONDS } from '@/lib/constants';
import { verifySpendQR } from '@/lib/qr';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify customer JWT from cookie
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Please sign in to earn points.' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign_id } = body;

    if (!campaign_id) {
      return NextResponse.json({ error: 'Invalid QR code.' }, { status: 400 });
    }

    // Accept spend params from body OR URL query string
    const url = new URL(req.url);
    const rawSig = body.sig || url.searchParams.get('sig') || '';
    const rawTs  = body.ts  || body.timestamp || url.searchParams.get('ts') || '';
    const rawA   = body.a   || body.amount_cents || url.searchParams.get('a') || '';
    const rawEur = body.amount_euros;

    // Resolve amount_cents (integer) from whichever source provided
    const amountCentsInt: number = rawA
      ? parseInt(rawA as string, 10)
      : rawEur
        ? Math.round(parseFloat(rawEur as string) * 100)
        : 0;

    // 2. Load campaign + merchant in one query
    const campaign = await queryOne<{
      id: string;
      merchant_id: string;
      name: string;
      campaign_type: 'visit_based' | 'spend_based';
      status: string;
      reward_threshold: number;
      reward_description: string;
      points_per_euro: number | null;
    }>(
      `SELECT c.id, c.merchant_id, c.name, c.campaign_type, c.status,
              c.reward_threshold, c.reward_description, c.points_per_euro
         FROM campaigns c
        WHERE c.id = ?`,
      [campaign_id],
    );

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
    }
    if (campaign.status !== 'active') {
      return NextResponse.json(
        { error: 'This loyalty campaign is temporarily paused.', code: 'campaign_paused' },
        { status: 422 },
      );
    }

    // 3. Spend-based: verify HMAC + timestamp window
    let amountEuros: number | null = null;
    if (campaign.campaign_type === 'spend_based') {
      if (!rawSig || !rawTs || !amountCentsInt) {
        return NextResponse.json(
          { error: 'Invalid spend QR — missing amount or signature.' },
          { status: 400 },
        );
      }
      const secret = process.env.QR_HMAC_SECRET || 'dev_secret';
      const valid = verifySpendQR(campaign_id, amountCentsInt, parseInt(rawTs as string, 10), rawSig as string, secret);
      if (!valid) {
        return NextResponse.json(
          { error: 'QR code has expired or is invalid. Ask the merchant to regenerate.' },
          { status: 422 },
        );
      }
      amountEuros = amountCentsInt / 100;
    }

    // 4–9. Run inside a MySQL transaction
    const result = await withTransaction(async (client) => {

      // 5. Idempotency: reject duplicate scans within the window
      const recent = await client.query(
        `SELECT id FROM point_transactions
           WHERE customer_id = ? AND campaign_id = ? AND transaction_type = 'earn'
             AND created_at > DATE_SUB(NOW(), INTERVAL ${SCAN_IDEMPOTENCY_WINDOW_SECONDS} SECOND)`,
        [auth.sub, campaign_id],
      );

      if (recent.rows.length > 0) {
        const enroll = await client.query(
          `SELECT points_balance, visit_count FROM enrollments
             WHERE customer_id = ? AND campaign_id = ?`,
          [auth.sub, campaign_id],
        );
        const e = enroll.rows[0];
        const cc = e
          ? (campaign.campaign_type === 'visit_based' ? Number(e.visit_count) : Number(e.points_balance))
          : 0;
        return { already_scanned: true, current_count: cc };
      }

      // 6. Find or create enrollment
      const existing = await client.query(
        'SELECT * FROM enrollments WHERE customer_id = ? AND campaign_id = ?',
        [auth.sub, campaign_id],
      );

      let enrollmentId: string;
      let currentCount: number;
      let cycleNumber: number;
      let enrollStatus: string;

      if (existing.rows.length === 0) {
        // New enrollment — use MySQL UUID()
        await client.query(
          `INSERT INTO enrollments
             (id, customer_id, campaign_id, merchant_id, status, visit_count, points_balance, cycle_number)
           VALUES (UUID(), ?, ?, ?, 'active', 0, 0, 1)`,
          [auth.sub, campaign_id, campaign.merchant_id],
        );
        const inserted = await client.query(
          'SELECT id FROM enrollments WHERE customer_id = ? AND campaign_id = ?',
          [auth.sub, campaign_id],
        );
        enrollmentId = inserted.rows[0].id as string;
        currentCount  = 0;
        cycleNumber   = 1;
        enrollStatus  = 'active';
      } else {
        const e = existing.rows[0];
        enrollmentId = e.id as string;
        currentCount = campaign.campaign_type === 'visit_based'
          ? Number(e.visit_count)
          : Number(e.points_balance);
        cycleNumber  = Number(e.cycle_number);
        enrollStatus = e.status as string;
      }

      if (enrollStatus === 'otp_pending') {
        return { blocked: true, reason: 'Complete your current redemption first.' };
      }

      // 7. Calculate points to add
      let pointsToAdd: number;
      if (campaign.campaign_type === 'visit_based') {
        pointsToAdd = 1;
      } else {
        pointsToAdd = Math.floor((amountEuros ?? 0) * (campaign.points_per_euro ?? 1));
        if (pointsToAdd <= 0) {
          return { blocked: true, reason: 'Spend amount is too small to earn points.' };
        }
      }

      const newCount = currentCount + pointsToAdd;

      // 8. Check threshold
      const rewardJustUnlocked =
        newCount >= campaign.reward_threshold && enrollStatus !== 'reward_unlocked';
      const newStatus = rewardJustUnlocked ? 'reward_unlocked' : enrollStatus;

      // Update visit_count / points_balance depending on campaign type
      const newVisitCount  = campaign.campaign_type === 'visit_based'  ? newCount : Number(existing.rows[0]?.visit_count ?? 0);
      const newPointsBal   = campaign.campaign_type === 'spend_based'  ? newCount : Number(existing.rows[0]?.points_balance ?? newCount);

      await client.query(
        `UPDATE enrollments
           SET visit_count = ?, points_balance = ?, status = ?, last_activity_at = NOW()
         WHERE id = ?`,
        [newVisitCount, newPointsBal, newStatus, enrollmentId],
      );

      // 9. Insert point_transaction with MySQL UUID()
      await client.query(
        `INSERT INTO point_transactions
           (id, enrollment_id, customer_id, campaign_id, merchant_id,
            transaction_type, points, amount_euros, cycle_number)
         VALUES (UUID(), ?, ?, ?, ?, 'earn', ?, ?, ?)`,
        [enrollmentId, auth.sub, campaign_id, campaign.merchant_id,
          pointsToAdd, amountEuros, cycleNumber],
      );

      // 10. Create customer notifications (non-blocking, best-effort)
      const remaining = campaign.reward_threshold - newCount;
      if (rewardJustUnlocked) {
        await client.query(
          `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, action_url, merchant_id)
           VALUES ('customer', ?, 'reward_unlocked', ?, ?, '/dashboard', ?)`,
          [auth.sub,
            '🎉 Reward Unlocked!',
            `You've unlocked your reward at ${campaign.reward_description}. Visit your dashboard to redeem it.`,
            campaign.merchant_id]
        );
      } else if (remaining === 1) {
        await client.query(
          `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, action_url, merchant_id)
           VALUES ('customer', ?, 'near_reward', ?, ?, '/dashboard', ?)`,
          [auth.sub,
            '⭐ Almost there!',
            `Just 1 more visit to unlock: ${campaign.reward_description}. Come back soon!`,
            campaign.merchant_id]
        );
      }

      // 11. Return spec response
      return {
        success: true,
        reward_unlocked: rewardJustUnlocked,
        current_count: newCount,
        threshold: campaign.reward_threshold,
        campaign_name: campaign.name,
        reward_description: campaign.reward_description,
        already_scanned: false,
        points_added: pointsToAdd,
      };
    });

    if (result.already_scanned) {
      return NextResponse.json({
        already_scanned: true,
        success: false,
        current_count: result.current_count,
        threshold: campaign.reward_threshold,
        campaign_name: campaign.name,
        reward_description: campaign.reward_description,
      });
    }

    if ('blocked' in result && result.blocked) {
      return NextResponse.json({ error: result.reason }, { status: 422 });
    }

    return NextResponse.json(result);

  } catch (err) {
    console.error('Scan error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
