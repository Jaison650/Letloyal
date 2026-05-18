import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import { query } from '@/lib/db';
import DashboardShell from '@/components/merchant/DashboardShell';
import RedemptionValidator from '@/components/merchant/RedemptionValidator';
import type { DemoHint } from '@/components/merchant/RedemptionValidator';

export default async function ValidatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) redirect('/merchant/login');

  const demoRows = await query<{ first_name: string; phone_number: string }>(
    `SELECT cu.first_name, cu.phone_number
     FROM redemptions r
     JOIN customers cu ON cu.id = r.customer_id
     WHERE r.merchant_id = ? AND r.status = 'pending_otp'
     GROUP BY cu.id, cu.first_name, cu.phone_number
     ORDER BY MAX(r.created_at) DESC
     LIMIT 3`,
    [merchant.id]
  );

  const demoHints: DemoHint[] = demoRows.map((row) => ({
    name:  row.first_name || 'Customer',
    phone: row.phone_number,
  }));

  return (
    <DashboardShell
      slug={slug}
      merchantName={merchant.business_name}
      planTier={merchant.plan_tier}
      logoSvg={merchant.logo_svg}
      brandColor={merchant.brand_color}
    >
      <div className="mb-8">
        <h1 className="font-sora font-bold text-2xl lg:text-3xl">Validate Redemption</h1>
        <p className="text-text-medium mt-1">
          Enter the customer&apos;s phone number and verify their 6-digit code to redeem their reward.
        </p>
      </div>
      <RedemptionValidator merchantSlug={slug} demoHints={demoHints} />
    </DashboardShell>
  );
}
