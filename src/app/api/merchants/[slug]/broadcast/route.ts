import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import { query, queryOne, withTransaction } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const broadcasts = await query<{ id: string; title: string; message: string; audience: string; sent_count: number; created_at: string }>(
    `SELECT id, title, message, audience, sent_count, created_at
       FROM broadcasts WHERE merchant_id = ?
       ORDER BY created_at DESC LIMIT 20`,
    [merchant.id]
  );
  return NextResponse.json({ broadcasts });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { title, message, audience = 'all' } = await req.json();
  if (!title || !message) return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
  if (!['all', 'near_reward', 'inactive'].includes(audience)) return NextResponse.json({ error: 'Invalid audience.' }, { status: 400 });

  const broadcastId = randomUUID();

  const result = await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO broadcasts (id, merchant_id, title, message, audience, sent_count)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [broadcastId, merchant.id, title, message, audience]
    );

    let audienceQuery = '';
    const audienceParams: unknown[] = [merchant.id];

    if (audience === 'all') {
      audienceQuery = `SELECT DISTINCT customer_id FROM enrollments WHERE merchant_id = ? AND status IN ('active','reward_unlocked')`;
    } else if (audience === 'near_reward') {
      audienceQuery = `
        SELECT DISTINCT e.customer_id FROM enrollments e
        JOIN campaigns c ON c.id = e.campaign_id
        WHERE e.merchant_id = ? AND e.status = 'active'
          AND (CASE c.campaign_type
               WHEN 'visit_based' THEN e.visit_count / c.reward_threshold
               ELSE e.points_balance / c.reward_threshold
             END) >= 0.6`;
    } else if (audience === 'inactive') {
      audienceQuery = `SELECT DISTINCT customer_id FROM enrollments WHERE merchant_id = ? AND status = 'active' AND last_activity_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    }

    const customers = await client.query(audienceQuery, audienceParams);
    const customerIds = (customers.rows as Array<{ customer_id: string }>).map(r => r.customer_id);

    for (const customerId of customerIds) {
      await client.query(
        `INSERT INTO notifications (recipient_type, recipient_id, type, title, body, action_url, merchant_id, broadcast_id)
         VALUES ('customer', ?, 'merchant_broadcast', ?, ?, '/dashboard', ?, ?)`,
        [customerId, title, message, merchant.id, broadcastId]
      );
    }

    await client.query(
      `UPDATE broadcasts SET sent_count = ? WHERE id = ?`,
      [customerIds.length, broadcastId]
    );

    return { sentCount: customerIds.length };
  });

  return NextResponse.json({ success: true, sentCount: result.sentCount, broadcastId });
}
