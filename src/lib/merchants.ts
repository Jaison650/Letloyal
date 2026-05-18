import { query, queryOne } from './db';

export interface Merchant {
  id: string;
  slug: string;
  business_name: string;
  category: string;
  tagline: string;
  address: string;
  city: string;
  logo_svg: string;
  brand_color: string;
  plan_tier: string;
  is_demo: boolean;
}

export interface Campaign {
  id: string;
  merchant_id: string;
  name: string;
  campaign_type: 'visit_based' | 'spend_based';
  status: 'active' | 'paused' | 'ended';
  reward_threshold: number;
  reward_description: string;
  points_per_euro: number | null;
  is_cyclic: boolean;
  start_date: string;
  end_date: string | null;
  participants_count: number;
  redemptions_count: number;
}

export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  return queryOne<Merchant>(
    `SELECT id, slug, business_name, category, tagline, address, city,
            logo_svg, brand_color, plan_tier, is_demo
       FROM merchants WHERE slug = ?`,
    [slug],
  );
}

export async function getMerchantWithAuth(
  slug: string,
): Promise<(Merchant & { password_hash: string }) | null> {
  return queryOne<Merchant & { password_hash: string }>(
    'SELECT * FROM merchants WHERE slug = ?',
    [slug],
  );
}

export async function getActiveCampaigns(merchantId: string): Promise<Campaign[]> {
  return query<Campaign>(
    `SELECT * FROM campaigns WHERE merchant_id = ? AND status = 'active' ORDER BY created_at DESC`,
    [merchantId],
  );
}

export async function getAllCampaigns(merchantId: string): Promise<Campaign[]> {
  return query<Campaign>(
    'SELECT * FROM campaigns WHERE merchant_id = ? ORDER BY created_at DESC',
    [merchantId],
  );
}

export async function getCampaignById(
  campaignId: string,
  merchantId: string,
): Promise<Campaign | null> {
  return queryOne<Campaign>(
    'SELECT * FROM campaigns WHERE id = ? AND merchant_id = ?',
    [campaignId, merchantId],
  );
}
