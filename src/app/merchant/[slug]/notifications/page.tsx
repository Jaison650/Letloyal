import { redirect } from 'next/navigation';
import { getMerchantAuthFromCookies, isMerchant } from '@/lib/auth';
import { getMerchantBySlug } from '@/lib/merchants';
import DashboardShell from '@/components/merchant/DashboardShell';
import BroadcastComposer from '@/components/merchant/BroadcastComposer';

export default async function NotificationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await getMerchantAuthFromCookies();
  if (!auth || !isMerchant(auth) || auth.slug !== slug) redirect('/merchant/login');

  const merchant = await getMerchantBySlug(slug);
  if (!merchant) redirect('/merchant/login');

  return (
    <DashboardShell
      slug={slug}
      merchantName={merchant.business_name}
      planTier={merchant.plan_tier}
      logoSvg={merchant.logo_svg}
      brandColor={merchant.brand_color}
    >
      <div className="mb-8">
        <h1 className="font-jakarta font-bold text-2xl lg:text-3xl">Customer Campaigns</h1>
        <p className="text-text-medium mt-1">
          Send targeted messages to your loyalty customers.
        </p>
      </div>
      <BroadcastComposer merchantSlug={slug} />
    </DashboardShell>
  );
}
