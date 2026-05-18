import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, isCustomer } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth || !isCustomer(auth)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [customer, enrollments, pendingOtps, allDemoMerchants] = await Promise.all([
      queryOne<{ id: string; first_name: string; phone_number: string }>(
        'SELECT id, first_name, phone_number FROM customers WHERE id = ?',
        [auth.sub]
      ),

      query<{
        enrollment_id: string;
        merchant_slug: string;
        merchant_name: string;
        merchant_logo_svg: string;
        merchant_brand_color: string;
        merchant_category: string;
        campaign_name: string;
        campaign_type: string;
        reward_description: string;
        visit_count: number;
        points_balance: number;
        reward_threshold: number;
        status: string;
        progress_pct: number;
        cycle_number: number;
        enrolled_at: string;
        last_activity_at: string;
      }>(
        `SELECT
           e.id                   AS enrollment_id,
           m.slug                 AS merchant_slug,
           m.business_name        AS merchant_name,
           m.logo_svg             AS merchant_logo_svg,
           m.brand_color          AS merchant_brand_color,
           m.category             AS merchant_category,
           c.name                 AS campaign_name,
           c.campaign_type,
           c.reward_description,
           e.visit_count,
           e.points_balance,
           c.reward_threshold,
           e.status,
           ROUND(
             CASE c.campaign_type
               WHEN 'visit_based'
                 THEN (e.visit_count    / NULLIF(c.reward_threshold, 0)) * 100
               ELSE    (e.points_balance / NULLIF(c.reward_threshold, 0)) * 100
             END
           )                      AS progress_pct,
           e.cycle_number,
           e.enrolled_at,
           e.last_activity_at
         FROM enrollments e
         JOIN campaigns  c ON c.id = e.campaign_id
         JOIN merchants  m ON m.id = e.merchant_id
         WHERE e.customer_id = ?
         ORDER BY
           CASE e.status
             WHEN 'reward_unlocked' THEN 0
             WHEN 'otp_pending'     THEN 1
             ELSE 2
           END,
           CASE c.campaign_type
             WHEN 'visit_based'
               THEN (e.visit_count    / NULLIF(c.reward_threshold, 0)) * 100
             ELSE    (e.points_balance / NULLIF(c.reward_threshold, 0)) * 100
           END DESC`,
        [auth.sub]
      ),

      // Pending OTPs — merged into enrollments below
      query<{
        enrollment_id: string;
        redemption_id: string;
        otp_code: string;
        expires_at: string;
        reward_description: string;
        merchant_name: string;
      }>(
        `SELECT r.enrollment_id,
                r.id                  AS redemption_id,
                r.otp_code,
                r.otp_expires_at      AS expires_at,
                c.reward_description,
                m.business_name       AS merchant_name
           FROM redemptions r
           JOIN campaigns c ON c.id  = r.campaign_id
           JOIN merchants  m ON m.id = r.merchant_id
          WHERE r.customer_id = ? AND r.status = 'pending_otp'
          ORDER BY r.created_at DESC`,
        [auth.sub]
      ),

      // All demo merchants — we'll subtract the enrolled ones
      query<{
        slug: string;
        business_name: string;
        logo_svg: string;
        category: string;
        brand_color: string;
        reward_description: string;
      }>(
        `SELECT m.slug, m.business_name, m.logo_svg, m.category, m.brand_color,
                c.reward_description
           FROM merchants m
           JOIN campaigns c ON c.merchant_id = m.id AND c.status = 'active'
          WHERE m.is_demo = 1`,
      ),
    ]);

    // Map pending OTPs onto their enrollments
    const otpMap = new Map(pendingOtps.map(o => [o.enrollment_id, o]));
    const enrichedEnrollments = enrollments.map(e => ({
      ...e,
      pending_otp: otpMap.get(e.enrollment_id) ?? null,
    }));

    // Demo merchants the customer has NOT yet enrolled in
    const enrolledSlugs = new Set(enrollments.map(e => e.merchant_slug));
    const demoMerchants = allDemoMerchants.filter(m => !enrolledSlugs.has(m.slug));

    return NextResponse.json({
      customer,
      enrollments: enrichedEnrollments,
      demo_merchants: demoMerchants,
    });
  } catch (err) {
    console.error('Customer dashboard error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard.' }, { status: 500 });
  }
}
