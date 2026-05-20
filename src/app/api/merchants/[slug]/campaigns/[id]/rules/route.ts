import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import { queryOne, query } from '@/lib/db';

interface RulesRow { rules: string | object }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;

  // Rules are public — no auth required for customers scanning
  const row = await queryOne<RulesRow>(
    `SELECT rules FROM offer_rules WHERE campaign_id = ?`,
    [id]
  );

  if (!row) {
    // Return sensible defaults if no rules row yet
    return NextResponse.json({
      rules: {
        items: [
          'One loyalty account per customer. Valid phone number required.',
          'Rewards must be redeemed in-store within 90 days of unlocking.',
          'Cannot be combined with other discounts or promotional offers.',
          'Reward has no cash alternative and is non-transferable.',
          'Management reserves the right to modify or withdraw this offer.',
        ],
        expiry_days: 90,
        one_per_visit: true,
        transferable: false,
      },
    });
  }

  const rules = typeof row.rules === 'string' ? JSON.parse(row.rules) : row.rules;
  return NextResponse.json({ rules });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { rules } = body;
  if (!rules || !Array.isArray(rules.items)) {
    return NextResponse.json({ error: 'Invalid rules format.' }, { status: 400 });
  }

  await query(
    `INSERT INTO offer_rules (campaign_id, merchant_id, rules)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rules = VALUES(rules), updated_at = NOW()`,
    [id, merchant.id, JSON.stringify(rules)]
  );

  return NextResponse.json({ success: true });
}
