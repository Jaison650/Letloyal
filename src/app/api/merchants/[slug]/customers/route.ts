import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest, isMerchant } from '@/lib/auth';
import { query } from '@/lib/db';
import { getMerchantBySlug } from '@/lib/merchants';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const auth = getMerchantAuthFromRequest(req);
    if (!auth || !isMerchant(auth) || auth.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await getMerchantBySlug(slug);
    if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const filter = req.nextUrl.searchParams.get('filter') || 'all';
    const search = req.nextUrl.searchParams.get('search') || '';

    let statusFilter = '';
    if (filter === 'near_reward') {
      statusFilter = `AND e.status = 'active' AND (
        (cam.campaign_type = 'visit_based'  AND (e.visit_count    / NULLIF(cam.reward_threshold, 0)) >= 0.7)
        OR
        (cam.campaign_type != 'visit_based' AND (e.points_balance / NULLIF(cam.reward_threshold, 0)) >= 0.7)
      )`;
    } else if (filter === 'reward_unlocked') {
      statusFilter = `AND e.status = 'reward_unlocked'`;
    } else if (filter === 'redeemed') {
      statusFilter = `AND e.cycle_number > 1`;
    }

    const queryParams: unknown[] = [merchant.id];
    let searchFilter = '';
    if (search) {
      searchFilter = `AND (cu.first_name LIKE ? OR cu.phone_number LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const customers = await query(
      `SELECT
         COALESCE(cu.first_name, 'Customer') as name,
         CONCAT(SUBSTRING(cu.phone_number, 1, 4), ' *** **', RIGHT(cu.phone_number, 2)) as masked_phone,
         e.enrolled_at as first_scan,
         e.points_balance as points,
         e.visit_count as visits,
         e.status,
         e.last_activity_at,
         e.cycle_number,
         cam.name as campaign_name,
         cam.reward_threshold as threshold,
         cam.campaign_type,
         ROUND(
           CASE cam.campaign_type
             WHEN 'visit_based' THEN (e.visit_count    / NULLIF(cam.reward_threshold, 0)) * 100
             ELSE                    (e.points_balance / NULLIF(cam.reward_threshold, 0)) * 100
           END
         ) as progress_pct
       FROM enrollments e
       JOIN customers cu  ON cu.id  = e.customer_id
       JOIN campaigns cam ON cam.id = e.campaign_id
       WHERE e.merchant_id = ? ${statusFilter} ${searchFilter}
       ORDER BY e.last_activity_at DESC
       LIMIT 100`,
      queryParams
    );

    return NextResponse.json({ customers });
  } catch (err) {
    console.error('Customers route error:', err);
    return NextResponse.json({ error: 'Failed to load customers.' }, { status: 500 });
  }
}
