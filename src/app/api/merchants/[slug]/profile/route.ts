import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import { query } from '@/lib/db';

// GET — public, used by customer store page
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    business_name: merchant.business_name,
    category:      merchant.category,
    tagline:       merchant.tagline,
    address:       merchant.address,
    city:          merchant.city,
    logo_url:      merchant.logo_url,
    banner_url:    merchant.banner_url,
    contact_phone: merchant.contact_phone,
    website:       merchant.website,
    map_url:       merchant.map_url,
    working_hours: merchant.working_hours,
    brand_color:   merchant.brand_color,
    logo_svg:      merchant.logo_svg,
  });
}

// PUT — merchant auth required
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const {
    tagline, address, city, contact_phone, website,
    map_url, banner_url, logo_url, working_hours,
  } = body;

  await query(
    `UPDATE merchants
        SET tagline       = ?,
            address       = ?,
            city          = ?,
            contact_phone = ?,
            website       = ?,
            map_url       = ?,
            banner_url    = ?,
            logo_url      = ?,
            working_hours = ?
      WHERE id = ?`,
    [
      tagline       ?? merchant.tagline,
      address       ?? merchant.address,
      city          ?? merchant.city,
      contact_phone ?? merchant.contact_phone,
      website       ?? merchant.website,
      map_url       ?? merchant.map_url,
      banner_url    ?? merchant.banner_url,
      logo_url      ?? merchant.logo_url,
      working_hours ? JSON.stringify(working_hours) : (merchant.working_hours ? JSON.stringify(merchant.working_hours) : null),
      merchant.id,
    ],
  );

  return NextResponse.json({ success: true });
}
